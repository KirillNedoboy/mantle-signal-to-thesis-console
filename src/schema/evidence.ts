import { z } from "zod";
import { ConfidenceSchema, EvidenceKindSchema } from "./enums";

export const EvidenceSchema = z.object({
  id: z.string().min(8),
  signalId: z.string().min(8),
  kind: EvidenceKindSchema,
  title: z.string().min(1),
  value: z.string().min(1),
  confidence: ConfidenceSchema,
  sourceRef: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
