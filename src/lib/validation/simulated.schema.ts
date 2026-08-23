import { z } from "zod";

export const SimulatedSourceEnum = z.enum(["Website", "App", "Support", "Survey", "Social"]);

export const SimulatedIngestSchema = z.object({
  source: SimulatedSourceEnum,
  text: z
    .string({ required_error: "Feedback text is required" })
    .min(3, "Feedback text must be at least 3 characters")
    .max(10000, "Feedback text cannot exceed 10,000 characters")
    .trim(),
  customerIdentifier: z.string().max(100).optional().nullable(),
  customerEmail: z.string().email().max(255).optional().nullable().or(z.literal("")),
  metadata: z.record(z.any()).optional(),
  skipAi: z.boolean().optional().default(false),
});

export type SimulatedIngestInputType = z.infer<typeof SimulatedIngestSchema>;
