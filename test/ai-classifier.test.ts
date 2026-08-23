import { describe, it, expect } from "vitest";
import {
  heuristicClassifyFeedback,
  AiClassificationResultSchema,
} from "../src/lib/ai/classifier";

describe("AI Feedback Classifier", () => {
  it("should classify positive customer feedback with accurate themes and scores", () => {
    const text = "The customer support team was amazing and resolved my issue in 5 minutes! Super happy.";
    const result = heuristicClassifyFeedback(text);

    expect(result.sentiment).toBe("POSITIVE");
    expect(result.sentimentScore).toBeGreaterThan(0);
    expect(result.featureArea).toBe("Customer Support");
    expect(result.themes.length).toBeGreaterThan(0);
    expect(result.rationale).toContain("positive");

    // Must strictly validate against Zod schema
    const validation = AiClassificationResultSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it("should classify negative payment feedback with accurate themes and scores", () => {
    const text = "My credit card failed during checkout and was charged twice without refund. Terrible bug.";
    const result = heuristicClassifyFeedback(text);

    expect(result.sentiment).toBe("NEGATIVE");
    expect(result.sentimentScore).toBeLessThan(0);
    expect(result.featureArea).toBe("Billing & Pricing");
    expect(result.themes).toContain("Refund Delays");

    const validation = AiClassificationResultSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it("should classify authentication issues accurately", () => {
    const text = "Cannot login to my account because the 2FA SMS code is not being delivered.";
    const result = heuristicClassifyFeedback(text);

    expect(result.featureArea).toBe("Authentication");
    expect(result.themes).toContain("2FA Verification");
  });

  it("should classify performance and latency complaints", () => {
    const text = "The dashboard is extremely slow and loading takes forever to open.";
    const result = heuristicClassifyFeedback(text);

    expect(result.sentiment).toBe("NEGATIVE");
    expect(result.featureArea).toBe("Performance");
    expect(result.themes).toContain("Page Load Latency");
  });
});
