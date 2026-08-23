import Anthropic from "@anthropic-ai/sdk";

// Server-side Anthropic Claude client
const apiKey = process.env.ANTHROPIC_API_KEY;

export const anthropic = apiKey
  ? new Anthropic({
      apiKey,
      timeout: 30000, // 30 second timeout
    })
  : null;

export const DEFAULT_CLAUDE_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

export function isClaudeAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);
}
