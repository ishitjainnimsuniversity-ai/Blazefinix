/**
 * High-performance normalized vector embedding and cosine similarity utility.
 * Generates deterministic dense semantic vectors (128 dimensions) for feedback clustering and retrieval.
 */

const VECTOR_DIMENSIONS = 128;

// Common semantic synonym clusters for feedback retrieval
const SYNONYM_MAP: Record<string, string[]> = {
  price: ["pricing", "cost", "billing", "expensive", "subscription", "plan", "charge", "invoice", "tier"],
  pricing: ["price", "cost", "billing", "expensive", "subscription", "plan", "charge", "invoice", "tier"],
  billing: ["payment", "invoice", "charge", "refund", "credit", "card", "amex", "checkout", "subscription"],
  payment: ["billing", "checkout", "card", "transaction", "amex", "stripe", "charge", "refund"],
  bug: ["error", "crash", "issue", "broken", "exception", "freeze", "failure", "fail"],
  crash: ["freeze", "exception", "terminate", "hang", "unresponsive", "broken", "bug"],
  login: ["auth", "authentication", "sso", "2fa", "password", "token", "session", "sign", "saml", "okta"],
  auth: ["login", "authentication", "sso", "2fa", "password", "token", "session", "sign", "saml", "okta"],
  "2fa": ["sms", "code", "mfa", "authenticator", "verification", "carrier", "login", "auth"],
  slow: ["latency", "speed", "lag", "delay", "timeout", "performance", "load", "loading"],
  fast: ["speed", "quick", "rapid", "responsive", "instant", "performance"],
  support: ["agent", "ticket", "service", "help", "resolution", "response", "zendesk"],
  export: ["download", "pdf", "csv", "report", "file"],
  dark: ["theme", "mode", "night", "ui", "contrast", "appearance"],
  mobile: ["app", "ios", "android", "phone", "iphone", "device"],
  onboarding: ["setup", "start", "tutorial", "guide", "checklist", "import"],
};

/**
 * Computes a normalized vector embedding for a given text string with semantic expansion.
 */
export function generateEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const vector = new Array(VECTOR_DIMENSIONS).fill(0);

  if (tokens.length === 0) {
    return vector;
  }

  // Collect expanded tokens via synonym mapping
  const expandedTokens = [...tokens];
  for (const t of tokens) {
    if (SYNONYM_MAP[t]) {
      expandedTokens.push(...SYNONYM_MAP[t]);
    }
  }

  // Hash-based semantic feature projection (Murmur/DJB2 hybrid hash distribution)
  for (let i = 0; i < expandedTokens.length; i++) {
    const token = expandedTokens[i];
    
    // Unigram hash
    let hash1 = 5381;
    for (let c = 0; c < token.length; c++) {
      hash1 = (hash1 * 33) ^ token.charCodeAt(c);
    }
    const idx1 = Math.abs(hash1) % VECTOR_DIMENSIONS;
    vector[idx1] += 1.5;

    // Bigram character hash for fuzzy semantic matching
    for (let j = 0; j < token.length - 1; j++) {
      const bigram = token.substring(j, j + 2);
      let hash2 = 0;
      for (let k = 0; k < bigram.length; k++) {
        hash2 = (hash2 << 5) - hash2 + bigram.charCodeAt(k);
      }
      const idx2 = Math.abs(hash2) % VECTOR_DIMENSIONS;
      vector[idx2] += 0.5;
    }
  }

  // L2 Normalize the vector
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
}

/**
 * Computes cosine similarity between two vectors (-1.0 to 1.0).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return Math.max(0, Math.min(1, dotProduct / denominator));
}

export interface ScoredEmbeddingItem {
  feedbackId: string;
  similarity: number;
}

/**
 * Ranks stored embeddings against a query embedding.
 */
export function rankEmbeddings(
  queryEmbedding: number[],
  items: Array<{ feedbackId: string; embedding: number[] }>,
  topK = 5
): ScoredEmbeddingItem[] {
  const scored = items.map((item) => ({
    feedbackId: item.feedbackId,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
