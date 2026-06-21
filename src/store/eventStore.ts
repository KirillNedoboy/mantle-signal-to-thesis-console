import fs from "node:fs";
import path from "node:path";
import { AgentEvent, AgentEventSchema } from "../schema/event";

export type AppendResult = {
  appended: boolean;
  eventId: string;
};

export function ensureParentDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function readEvents(filePath: string): AgentEvent[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];

  return raw.split("\n").map((line, index) => {
    try {
      return AgentEventSchema.parse(JSON.parse(line));
    } catch (error) {
      throw new Error(`Invalid event at line ${index + 1} in ${filePath}: ${(error as Error).message}`);
    }
  });
}

export function appendEvent(filePath: string, event: AgentEvent): AppendResult {
  const parsed = AgentEventSchema.parse(event);
  ensureParentDir(filePath);
  const existingIds = new Set(readEvents(filePath).map((item) => item.eventId));

  if (existingIds.has(parsed.eventId)) {
    return { appended: false, eventId: parsed.eventId };
  }

  fs.appendFileSync(filePath, `${JSON.stringify(parsed)}\n`, "utf8");
  return { appended: true, eventId: parsed.eventId };
}

export function appendEvents(filePath: string, events: AgentEvent[]): AppendResult[] {
  return events.map((event) => appendEvent(filePath, event));
}
