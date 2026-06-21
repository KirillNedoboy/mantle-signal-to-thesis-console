import { createHash } from "node:crypto";

export function deterministicId(prefix: string, input: unknown): string {
  const raw = typeof input === "string" ? input : JSON.stringify(input);
  const digest = createHash("sha256").update(raw).digest("hex").slice(0, 24);
  return `${prefix}_${digest}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
