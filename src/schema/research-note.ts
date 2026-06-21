import { z } from "zod";
import { DecisionValueSchema } from "./enums";

export const ResearchNoteSchema = z.object({
  id: z.string().min(8),
  signalId: z.string().min(8),
  thesis: z.string().min(1),
  whySurfaced: z.string().min(1),
  riskSummary: z.string().min(1),
  missingData: z.array(z.string().min(1)),
  nextManualChecks: z.array(z.string().min(1)),
  suggestedDecision: DecisionValueSchema,
  disclaimer: z.literal("not_a_buy_signal"),
  createdAt: z.string().datetime(),
});

export type ResearchNote = z.infer<typeof ResearchNoteSchema>;
