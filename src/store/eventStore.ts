import fs from "node:fs";
import path from "node:path";
import { AgentEvent, AgentEventSchema } from "../schema/event";

export type AppendResult = {
  appended: boolean;
  eventId: string;
  reason?: "duplicate" | "invalid";
};

/**
 * Ensure the parent directory of `filePath` exists.
 * Idempotent: safe to call before any append.
 */
export function ensureParentDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/**
 * Read all events from a JSONL file.
 *
 * Returns [] if the file does not exist or is empty.
 * Throws a precise error on malformed lines (with line number and file path).
 */
export function readEvents(filePath: string): AgentEvent[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return [];

  const events: AgentEvent[] = [];
  raw.split("\n").forEach((line, index) => {
    if (!line.trim()) return; // skip blank lines
    try {
      events.push(AgentEventSchema.parse(JSON.parse(line)));
    } catch (error) {
      throw new Error(
        `Invalid event at ${filePath}:${index + 1}: ${(error as Error).message}`,
      );
    }
  });
  return events;
}

/**
 * Append a single event to the file.
 *
 * Dedup is performed against the *current* file contents (single read).
 */
export function appendEvent(filePath: string, event: AgentEvent): AppendResult {
  const parsed = AgentEventSchema.parse(event);
  ensureParentDir(filePath);

  const existingIds = new Set(readEvents(filePath).map((e) => e.eventId));
  if (existingIds.has(parsed.eventId)) {
    return { appended: false, eventId: parsed.eventId, reason: "duplicate" };
  }

  fs.appendFileSync(filePath, `${JSON.stringify(parsed)}\n`, "utf8");
  return { appended: true, eventId: parsed.eventId };
}

/**
 * Append a batch of events to the file.
 *
 * Performance contract:
 *   - The existing file is read AT MOST ONCE per call (not per event).
 *   - Within a single batch, duplicate eventIds are deduped deterministically
 *     (first occurrence wins).
 *   - Output order matches input order for events that survive dedup.
 *
 * Concurrency caveat:
 *   - This implementation does NOT use OS-level file locking (flock / OFD
 *     locks / POSIX advisory locks). Concurrent writers from separate
 *     Node processes can race and produce duplicate or interleaved writes.
 *     For hackathon / single-process use this is acceptable. Do NOT use this
 *     store from multiple processes without adding proper locking first.
 */
export function appendEvents(
  filePath: string,
  events: AgentEvent[],
): AppendResult[] {
  if (events.length === 0) return [];

  // Validate every event up front, with the original index in the error.
  events.forEach((e, i) => {
    try {
      AgentEventSchema.parse(e);
    } catch (err) {
      throw new Error(
        `Invalid event at batch index ${i} (eventId=${e?.eventId ?? "<missing>"}): ${(err as Error).message}`,
      );
    }
  });

  ensureParentDir(filePath);

  // Read existing events ONCE.
  const existing = readEvents(filePath);
  const seen = new Set<string>(existing.map((e) => e.eventId));

  const toWrite: AgentEvent[] = [];
  const results: AppendResult[] = [];

  for (const event of events) {
    const id = event.eventId;
    if (seen.has(id)) {
      results.push({ appended: false, eventId: id, reason: "duplicate" });
      continue;
    }
    seen.add(id);
    toWrite.push(event);
    results.push({ appended: true, eventId: id });
  }

  if (toWrite.length > 0) {
    const payload = toWrite.map((e) => JSON.stringify(e)).join("\n") + "\n";
    try {
      fs.appendFileSync(filePath, payload, "utf8");
    } catch (err) {
      // Surface write failures explicitly. Do not swallow.
      throw new Error(
        `Failed to append ${toWrite.length} event(s) to ${filePath}: ${(err as Error).message}`,
      );
    }
  }

  return results;
}
