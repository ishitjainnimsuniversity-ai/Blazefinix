import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { AskLoopSchema } from "@/lib/validation/ask-loop.schema";
import { AskLoopService } from "@/services/ask-loop.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/ask-loop
 * Answers questions about workspace feedback using grounded semantic vector retrieval.
 * Returns grounded answer + cited evidence snippets with similarity rankings.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const body = await req.json();
    const input = AskLoopSchema.parse(body);

    const result = await AskLoopService.ask(session.workspaceId, input);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
