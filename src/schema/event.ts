import { z } from "zod";
import { DecisionSchema } from "./decision";
import { EvidenceSchema } from "./evidence";
import { ResearchNoteSchema } from "./research-note";
import { ScoreSchema } from "./score";
import { SignalSchema } from "./signal";

const BaseEventSchema = z.object({
  eventId: z.string().min(12),
  createdAt: z.string().datetime(),
  agent: z.string().min(1),
});

export const SignalDetectedEventSchema = BaseEventSchema.extend({
  type: z.literal("signal_detected"),
  signal: SignalSchema,
});

export const EvidenceAddedEventSchema = BaseEventSchema.extend({
  type: z.literal("evidence_added"),
  evidence: EvidenceSchema,
});

export const ScoreUpdatedEventSchema = BaseEventSchema.extend({
  type: z.literal("score_updated"),
  score: ScoreSchema,
});

export const ResearchNoteCreatedEventSchema = BaseEventSchema.extend({
  type: z.literal("research_note_created"),
  note: ResearchNoteSchema,
});

export const DecisionRecordedEventSchema = BaseEventSchema.extend({
  type: z.literal("decision_recorded"),
  decision: DecisionSchema,
});

export const AgentEventSchema = z.discriminatedUnion("type", [
  SignalDetectedEventSchema,
  EvidenceAddedEventSchema,
  ScoreUpdatedEventSchema,
  ResearchNoteCreatedEventSchema,
  DecisionRecordedEventSchema,
]);

export type AgentEvent = z.infer<typeof AgentEventSchema>;
