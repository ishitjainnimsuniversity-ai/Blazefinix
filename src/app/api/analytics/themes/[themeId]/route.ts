import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { AnalyticsService } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    themeId: string;
  };
}

/**
 * GET /api/analytics/themes/[themeId]
 * Retrieves theme details and its linked feedback records.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession(req);
    const result = await AnalyticsService.getThemeDrilldown(session.workspaceId, params.themeId);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
