import { NextRequest } from "next/server";
import { getAuthSession, requireRole } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { UpdateFeedbackStatusSchema } from "@/lib/validation/feedback.schema";
import { FeedbackService } from "@/services/feedback.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/feedback/[id]
 * Retrieves single feedback item with AI analysis and associated themes.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession(req);
    const result = await FeedbackService.getFeedbackById(session.workspaceId, params.id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/feedback/[id]
 * Updates status of a feedback item (NEW, REVIEWED, RESOLVED, ARCHIVED).
 * RBAC: ADMIN, ANALYST
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ["ADMIN", "ANALYST"]);

    const body = await req.json();
    const { status } = UpdateFeedbackStatusSchema.parse(body);

    const result = await FeedbackService.updateStatus(session.workspaceId, params.id, status);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/feedback/[id]
 * Deletes a feedback item.
 * RBAC: ADMIN, ANALYST
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ["ADMIN", "ANALYST"]);

    const result = await FeedbackService.deleteFeedback(session.workspaceId, params.id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
