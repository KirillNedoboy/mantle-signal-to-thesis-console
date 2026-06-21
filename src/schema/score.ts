import { z } from "zod";
import { MantleRelevanceSchema, RiskFlagSchema } from "./enums";

export const ScoreSchema = z.object({
  signalId: z.string().min(8),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  mantleRelevance: MantleRelevanceSchema,
  riskFlags: z.array(RiskFlagSchema),
  reasons: z.array(z.string().min(1)),
  updatedAt: z.string().datetime(),
});

export type Score = z.infer<typeof ScoreSchema>;
