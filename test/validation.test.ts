import { describe, it, expect } from "vitest";
import {
  CreateFeedbackSchema,
  FeedbackListQuerySchema,
  UpdateFeedbackStatusSchema,
  BatchUpdateStatusSchema,
} from "../src/lib/validation/feedback.schema";
import { CsvFeedbackRowSchema } from "../src/lib/validation/csv.schema";
import { SimulatedIngestSchema } from "../src/lib/validation/simulated.schema";
import { AskLoopSchema } from "../src/lib/validation/ask-loop.schema";
import { GenerateVocReportSchema } from "../src/lib/validation/voc-report.schema";

describe("Validation Schemas", () => {
  describe("Feedback Creation Schema", () => {
    it("should accept valid feedback payload", () => {
      const validData = {
        rawText: "The checkout process was fast and seamless!",
        source: "Website",
        customerName: "Alice Smith",
        customerEmail: "alice@example.com",
        status: "NEW",
      };
      const result = CreateFeedbackSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject feedback with text shorter than 3 chars", () => {
      const invalidData = { rawText: "ok" };
      const result = CreateFeedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid customer email", () => {
      const invalidData = {
        rawText: "Valid feedback text here",
        customerEmail: "not-an-email",
      };
      const result = CreateFeedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("Feedback List Query Schema", () => {
    it("should provide default pagination values", () => {
      const parsed = FeedbackListQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(20);
      expect(parsed.sortBy).toBe("createdAt");
      expect(parsed.sortOrder).toBe("desc");
    });

    it("should parse filter parameters correctly", () => {
      const parsed = FeedbackListQuerySchema.parse({
        page: "2",
        pageSize: "50",
        sentiment: "POSITIVE",
        search: "latency",
        status: "REVIEWED",
      });
      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(50);
      expect(parsed.sentiment).toBe("POSITIVE");
      expect(parsed.search).toBe("latency");
      expect(parsed.status).toBe("REVIEWED");
    });
  });

  describe("CSV Feedback Row Schema", () => {
    it("should parse valid CSV row", () => {
      const row = {
        text: "The search filters are not working on mobile",
        source: "App",
        customerName: "Bob",
        customerEmail: "bob@example.com",
        status: "NEW",
      };
      const result = CsvFeedbackRowSchema.safeParse(row);
      expect(result.success).toBe(true);
    });

    it("should reject empty text in CSV row", () => {
      const row = { text: "  " };
      const result = CsvFeedbackRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });
  });

  describe("Simulated Ingestion Schema", () => {
    it("should accept valid simulated channels", () => {
      const validChannels = ["Website", "App", "Support", "Survey", "Social"] as const;
      for (const source of validChannels) {
        const result = SimulatedIngestSchema.safeParse({
          source,
          text: `Sample feedback from ${source} channel`,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject unsupported simulated channels", () => {
      const result = SimulatedIngestSchema.safeParse({
        source: "InvalidChannel",
        text: "Sample feedback text",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Ask LOOP Schema", () => {
    it("should accept valid question", () => {
      const result = AskLoopSchema.safeParse({
        question: "Why are customers complaining about payment delays?",
        topK: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty question", () => {
      const result = AskLoopSchema.safeParse({ question: " " });
      expect(result.success).toBe(false);
    });
  });

  describe("VOC Report Generation Schema", () => {
    it("should accept valid periods", () => {
      const result = GenerateVocReportSchema.safeParse({
        period: "Last 30 Days",
      });
      expect(result.success).toBe(true);
    });
  });
});
