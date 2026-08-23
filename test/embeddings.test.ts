import { describe, it, expect } from "vitest";
import {
  generateEmbedding,
  cosineSimilarity,
  rankEmbeddings,
} from "../src/lib/ai/embeddings";

describe("Vector Embeddings & Semantic Similarity", () => {
  it("should generate normalized 128-dimensional dense vector embeddings", () => {
    const vec = generateEmbedding("Customer credit card payment timeout during checkout");
    expect(vec.length).toBe(128);

    // Verify L2 norm is ~1.0
    let norm = 0;
    for (const val of vec) norm += val * val;
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 2);
  });

  it("should yield high similarity for semantically related queries", () => {
    const vec1 = generateEmbedding("Credit card payment failed on billing renewal");
    const vec2 = generateEmbedding("Payment declined during checkout subscription billing");
    const vecUnrelated = generateEmbedding("Dark mode color palette on mobile application");

    const simRelated = cosineSimilarity(vec1, vec2);
    const simUnrelated = cosineSimilarity(vec1, vecUnrelated);

    expect(simRelated).toBeGreaterThan(simUnrelated);
    expect(simRelated).toBeGreaterThan(0.4);
  });

  it("should rank embeddings accurately and filter topK matches", () => {
    const query = generateEmbedding("login authentication password reset issues");

    const pool = [
      { feedbackId: "fb-1", embedding: generateEmbedding("Cannot reset my account password on login screen") },
      { feedbackId: "fb-2", embedding: generateEmbedding("Refund took 10 days to process through bank") },
      { feedbackId: "fb-3", embedding: generateEmbedding("2FA authentication token is invalid on sign in") },
    ];

    const ranked = rankEmbeddings(query, pool, 2);
    expect(ranked.length).toBe(2);
    expect(ranked[0].feedbackId).toBe("fb-1");
    expect(ranked[0].similarity).toBeGreaterThan(ranked[1].similarity);
  });
});
