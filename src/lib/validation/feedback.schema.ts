import { z } from "zod";

export const FeedbackStatusEnum = z.enum(["NEW", "REVIEWED", "RESOLVED", "ARCHIVED"]);
export const SentimentEnum = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]);

export const CreateFeedbackSchema = z.object({
  rawText: z
    .string({ required_error: "Feedback text is required" })
    .min(3, "Feedback text must be at least 3 characters")
    .max(10000, "Feedback text cannot exceed 10,000 characters")
    .trim(),
  source: z
    .string()
    .min(1)
    .max(50)
    .default("Manual"),
  customerName: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  customerEmail: z
    .string()
    .email("Invalid customer email address")
    .max(255)
    .optional()
    .nullable(),
  status: FeedbackStatusEnum.default("NEW"),
  skipAi: z.boolean().optional().default(false),
});

export const UpdateFeedbackStatusSchema = z.object({
  status: FeedbackStatusEnum,
});

export const BatchUpdateStatusSchema = z.object({
  feedbackIds: z
    .array(z.string().min(1))
    .min(1, "At least one feedback ID is required")
    .max(500, "Cannot update more than 500 feedback items at once"),
  status: FeedbackStatusEnum,
});

export const FeedbackListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  sentiment: SentimentEnum.optional(),
  theme: z.string().trim().optional(),
  status: FeedbackStatusEnum.optional(),
  source: z.string().trim().optional(),
  featureArea: z.string().trim().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  sortBy: z.enum(["createdAt", "sentimentScore", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateFeedbackInputType = z.infer<typeof CreateFeedbackSchema>;
export type UpdateFeedbackStatusInputType = z.infer<typeof UpdateFeedbackStatusSchema>;
export type BatchUpdateStatusInputType = z.infer<typeof BatchUpdateStatusSchema>;
export type FeedbackListQueryType = z.infer<typeof FeedbackListQuerySchema>;
