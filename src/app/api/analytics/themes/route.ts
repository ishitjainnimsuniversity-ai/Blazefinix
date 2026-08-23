import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { AnalyticsService } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/themes
 * Retrieves all themes with counts, percentages, and sentiment breakdowns.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const themes = await AnalyticsService.getThemeStats(session.workspaceId);
    return apiSuccess(themes);
  } catch (error) {
    return handleApiError(error);
  }
}
