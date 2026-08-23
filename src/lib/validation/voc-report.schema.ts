import { z } from "zod";

export const GenerateVocReportSchema = z.object({
  period: z
    .enum(["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"])
    .optional()
    .default("Last 30 Days"),
  days: z.number().int().positive().max(365).optional(),
});

export type GenerateVocReportInputType = z.infer<typeof GenerateVocReportSchema>;
