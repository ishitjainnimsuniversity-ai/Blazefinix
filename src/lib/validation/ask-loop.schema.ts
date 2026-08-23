import { z } from "zod";

export const AskLoopSchema = z.object({
  question: z
    .string({ required_error: "Question is required" })
    .min(3, "Question must be at least 3 characters")
    .max(500, "Question cannot exceed 500 characters")
    .trim(),
  topK: z.number().int().min(1).max(20).optional().default(5),
});

export type AskLoopInputType = z.infer<typeof AskLoopSchema>;
