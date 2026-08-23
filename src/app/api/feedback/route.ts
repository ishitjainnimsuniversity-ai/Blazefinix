import { NextRequest } from "next/server";
import { getAuthSession, requireRole } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { CreateFeedbackSchema, FeedbackListQuerySchema } from "@/lib/validation/feedback.schema";
import { FeedbackService } from "@/services/feedback.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/feedback
 * Lists feedback records with pagination, filtering, searching, and sorting.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = FeedbackListQuerySchema.parse(searchParams);

    const result = await FeedbackService.listFeedback(session.workspaceId, query);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/feedback
 * Creates a single customer feedback item and performs AI auto-classification.
 * RBAC: ADMIN, ANALYST
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ["ADMIN", "ANALYST"]);

    const body = await req.json();
    const input = CreateFeedbackSchema.parse(body);

    const result = await FeedbackService.createFeedback(session.workspaceId, input);
    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
