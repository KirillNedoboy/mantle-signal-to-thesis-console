/**
 * Mantle Docs Skill — read-only wrapper around the official Mantle Network MCP server.
 *
 * Endpoint:    https://docs.mantle.xyz/network/~gitbook/mcp
 * Tools used:  searchDocumentation(query), getPage(url)
 *
 * Integration path:
 *   - This module shells out to a stdlib Python client that lives at
 *     $HERMES_HOME/skills/web3/mantle-agent-skill/scripts/mantle_mcp_client.py
 *   - The Python client is shipped with the optional `mantle-agent-skill`
 *     Hermes skill. It is NOT a required dependency of this project.
 *   - When the client is missing or the network call fails, the skill
 *     reports an explicit `MCP_UNAVAILABLE` status. The agent loop, demo
 *     fixtures, and tests must NEVER depend on Mantle docs being available.
 *
 * Safety:
 *   - Read-only. Never signs, sends, or mutates anything.
 *   - Never throws on missing client / network errors. Returns a result
 *     with `status: "MCP_UNAVAILABLE"` and a human-readable warning.
 *
 * Calls are logged via the Python client to
 *   $HERMES_HOME/logs/web3/mantle-agent-skill/YYYY-MM-DD.jsonl
 * (only when the client is present and reachable).
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

/**
 * Status of a Mantle docs lookup.
 *   "ok"               — MCP reachable, hits returned (possibly empty).
 *   "ok_empty"         — MCP reachable, no hits for the query.
 *   "MCP_UNAVAILABLE"  — client missing or call failed; explicit non-fatal status.
 */
export type MantleDocStatus = "ok" | "ok_empty" | "MCP_UNAVAILABLE";

export type MantleDocResult = {
  status: MantleDocStatus;
  hits: MantleDocHit[];
  warning: string | null;
  latencyMs: number | null;
  reason: string | null;
};

const PYTHON_CLIENT = path.join(
  process.env.HERMES_HOME || path.join(os.homedir(), ".hermes"),
  "skills",
  "web3",
  "mantle-agent-skill",
  "scripts",
  "mantle_mcp_client.py",
);

function resolveClientPath(): { path: string; available: boolean } {
  if (fs.existsSync(PYTHON_CLIENT)) return { path: PYTHON_CLIENT, available: true };
  const fallback = "/root/.hermes/skills/web3/mantle-agent-skill/scripts/mantle_mcp_client.py";
  if (fs.existsSync(fallback)) return { path: fallback, available: true };
  return { path: PYTHON_CLIENT, available: false };
}

function unavailable(reason: string, latencyMs: number | null = null): MantleDocResult {
  return {
    status: "MCP_UNAVAILABLE",
    hits: [],
    warning: `mantleDocsSkill: ${reason}`,
    latencyMs,
    reason,
  };
}

function runPythonJson<T>(args: string[]): { ok: boolean; data: T | null; warning: string; reason: string | null } {
  const { path: client, available } = resolveClientPath();
  if (!available) {
    return {
      ok: false,
      data: null,
      warning: `client not found at ${client}`,
      reason: "client_missing",
    };
  }
  const started = Date.now();
  try {
    const stdout = execFileSync("python3", [client, ...args], {
      timeout: 35_000,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const data = JSON.parse(stdout) as T;
    return { ok: true, data, warning: "", reason: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stderr =
      (err as { stderr?: Buffer | string }).stderr?.toString?.() ?? "";
    return {
      ok: false,
      data: null,
      warning: stderr || message,
      reason: `exec_failed (${Date.now() - started}ms)`,
    };
  }
}

/**
 * Look up Mantle documentation.
 * Never throws. Always returns a result with an explicit status.
 */
export function searchMantleDocs(query: string): MantleDocResult {
  if (!query || !query.trim()) {
    return unavailable("empty query", null);
  }
  const started = Date.now();
  const res = runPythonJson<{
    status: string;
    data?: { results?: MantleDocHit[] };
    warnings?: string[];
  }>(["search", query]);

  if (!res.ok || !res.data) {
    return unavailable(res.warning || "unknown error", Date.now() - started);
  }
  const hits = (res.data.data?.results ?? []).filter(
    (h) => typeof h?.link === "string" && h.link.startsWith("https://docs.mantle.xyz/network"),
  );
  return {
    status: res.data.status === "ok" ? (hits.length ? "ok" : "ok_empty") : "MCP_UNAVAILABLE",
    hits,
    warning: res.data.warnings?.join("; ") || null,
    latencyMs: Date.now() - started,
    reason: null,
  };
}

export function bestHitForSignal(
  signalName: string,
  symbol: string | undefined,
  category: string,
): MantleDocHit | null {
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

/**
 * Test-only helper: indicates whether the Mantle MCP client is reachable
 * on this host. Used by tests and by demo code that wants to surface
 * a clear "docs offline" badge instead of a silent fallback.
 */
export function isMantleDocsAvailable(): { available: boolean; reason: string | null } {
  const { available } = resolveClientPath();
  if (!available) {
    return { available: false, reason: "client_missing" };
  }
  return { available: true, reason: null };
}
