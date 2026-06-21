import { z } from "zod";
import {
  ChainSchema,
  MantleRelevanceSchema,
  SignalCategorySchema,
  SignalSourceSchema,
  SignalStatusSchema,
} from "./enums";

export const SignalSchema = z.object({
  id: z.string().min(8),
  source: SignalSourceSchema,
  chain: ChainSchema,
  name: z.string().min(1),
  symbol: z.string().min(1).optional(),
  contractAddress: z.string().min(1).optional(),
  pairAddress: z.string().min(1).optional(),
  detectedAt: z.string().datetime(),
  category: SignalCategorySchema,
  status: SignalStatusSchema.default("NEW"),
  mantleRelevance: MantleRelevanceSchema.default("not_relevant"),
  sourceRef: z.string().min(1).optional(),
});

export type Signal = z.infer<typeof SignalSchema>;
