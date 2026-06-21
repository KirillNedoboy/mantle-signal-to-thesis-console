import { z } from "zod";
import { ActorSchema, DecisionValueSchema } from "./enums";

export const DecisionSchema = z.object({
  id: z.string().min(8),
  signalId: z.string().min(8),
  decision: DecisionValueSchema,
  reason: z.string().min(1),
  actor: ActorSchema,
  createdAt: z.string().datetime(),
});

export type Decision = z.infer<typeof DecisionSchema>;
