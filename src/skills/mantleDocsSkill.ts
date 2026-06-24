/**
 * Mantle Docs Skill — read-only wrapper around the official Mantle Network MCP server.
 *
 * Endpoint: https://docs.mantle.xyz/network/~gitbook/mcp
 * Tools used: searchDocumentation(query) and getPage(url)
 *
 * This module is intentionally thin: it shells out to a small stdlib Python
 * client so the Node side has zero new runtime dependencies. The Python client
 * lives at $HERMES_HOME/skills/web3/mantle-agent-skill/scripts/mantle_mcp_client.py
 * and is shipped with the `mantle-agent-skill` Hermes skill.
 *
 * Behavior:
 *   - Read-only. Never signs, sends, or mutates anything.
 *   - On any error, returns an empty result and a warning string (the agent
 *     loop must not crash when Mantle docs are unreachable).
 *   - All calls are logged via the Python client to
 *     $HERMES_HOME/logs/web3/mantle-agent-skill/YYYY-MM-DD.jsonl.
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

export type MantleDocHit = {
  title: string;
  link: string;
  content: string;
};

export type MantleDocResult = {
  ok: boolean;
  hits: MantleDocHit[];
  warning: string | null;
  latencyMs: number | null;
};

const PYTHON_CLIENT = path.join(
  process.env.HERMES_HOME || path.join(os.homedir(), ".hermes"),
  "skills",
  "web3",
  "mantle-agent-skill",
  "scripts",
  "mantle_mcp_client.py",
);

function resolveClientPath(): string {
  if (fs.existsSync(PYTHON_CLIENT)) return PYTHON_CLIENT;
  // Fallback: well-known absolute path on this host.
  const fallback = "/root/.hermes/skills/web3/mantle-agent-skill/scripts/mantle_mcp_client.py";
  if (fs.existsSync(fallback)) return fallback;
  return PYTHON_CLIENT; // last resort; exec will surface a clear error.
}

function runPythonJson<T>(args: string[]): { ok: boolean; data: T | null; warning: string } {
  const client = resolveClientPath();
  const started = Date.now();
  try {
    const stdout = execFileSync("python3", [client, ...args], {
      timeout: 35_000,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const data = JSON.parse(stdout) as T;
    return { ok: true, data, warning: "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stderr =
      (err as { stderr?: Buffer | string }).stderr?.toString?.() ?? "";
    return {
      ok: false,
      data: null,
      warning: `mantleDocsSkill: ${stderr || message} (after ${Date.now() - started}ms)`,
    };
  }
}

export function searchMantleDocs(query: string): MantleDocResult {
  if (!query || !query.trim()) {
    return { ok: false, hits: [], warning: "empty query", latencyMs: null };
  }
  const started = Date.now();
  const res = runPythonJson<{
    status: string;
    data?: { results?: MantleDocHit[] };
    warnings?: string[];
  }>(["search", query]);

  if (!res.ok || !res.data) {
    return { ok: false, hits: [], warning: res.warning, latencyMs: null };
  }
  const hits = (res.data.data?.results ?? []).filter(
    (h) => typeof h?.link === "string" && h.link.startsWith("https://docs.mantle.xyz/network"),
  );
  return {
    ok: res.data.status === "ok",
    hits,
    warning: res.data.warnings?.join("; ") || null,
    latencyMs: Date.now() - started,
  };
}

export function bestHitForSignal(
  signalName: string,
  symbol: string | undefined,
  category: string,
): MantleDocHit | null {
  // Build a focused query. The Mantle MCP search tolerates a few words and
  // returns a small number of hits, so the cost of a single call is low.
  const terms: string[] = [];
  if (category === "MANTLE_RESEARCH_SIGNAL") {
    terms.push("Mantle");
    terms.push("tokenized assets");
    if (symbol) terms.push(symbol);
    if (signalName) terms.push(signalName);
  } else if (category === "RESEARCH_FINDING") {
    terms.push("Mantle research");
    terms.push("builder grants");
  } else if (category === "SCOUT_PREVIEW") {
    terms.push("Mantle ecosystem");
  } else {
    terms.push("Mantle network");
  }
  const query = terms.slice(0, 6).join(" ");
  const res = searchMantleDocs(query);
  return res.hits[0] ?? null;
}
