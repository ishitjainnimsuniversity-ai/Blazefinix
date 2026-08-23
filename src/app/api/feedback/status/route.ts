import { NextRequest } from "next/server";
import { getAuthSession, requireRole } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { BatchUpdateStatusSchema } from "@/lib/validation/feedback.schema";
import { FeedbackService } from "@/services/feedback.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/feedback/status
 * Batch updates feedback statuses.
 * RBAC: ADMIN, ANALYST
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ["ADMIN", "ANALYST"]);

    const body = await req.json();
    const { feedbackIds, status } = BatchUpdateStatusSchema.parse(body);

    const result = await FeedbackService.batchUpdateStatus(
      session.workspaceId,
      feedbackIds,
      status
    );

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
