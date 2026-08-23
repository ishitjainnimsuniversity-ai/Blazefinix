import { z } from "zod";
import { FeedbackStatusEnum } from "./feedback.schema";

// Single row schema for CSV parsing
export const CsvFeedbackRowSchema = z.object({
  text: z
    .string({ required_error: "Feedback text ('text' or 'feedback') is required" })
    .min(3, "Feedback text must be at least 3 characters")
    .max(10000, "Feedback text cannot exceed 10,000 characters")
    .trim(),
  source: z
    .string()
    .max(50)
    .optional()
    .default("CSV Import"),
  customerName: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  customerEmail: z
    .string()
    .email("Invalid email format")
    .max(255)
    .optional()
    .nullable()
    .or(z.literal("")),
  status: FeedbackStatusEnum.optional().default("NEW"),
});

export const CsvUploadPayloadSchema = z.object({
  csvContent: z.string().min(5, "CSV content cannot be empty"),
  source: z.string().optional().default("CSV Import"),
  skipAi: z.boolean().optional().default(false),
});

export type CsvFeedbackRowType = z.infer<typeof CsvFeedbackRowSchema>;
export type CsvUploadPayloadType = z.infer<typeof CsvUploadPayloadSchema>;
