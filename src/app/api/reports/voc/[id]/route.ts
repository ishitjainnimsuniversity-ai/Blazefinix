import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { VocReportService } from "@/services/voc-report.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/reports/voc/[id]
 * Retrieves a single Voice-of-Customer report by ID.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession(req);
    const report = await VocReportService.getReportById(session.workspaceId, params.id);
    return apiSuccess(report);
  } catch (error) {
    return handleApiError(error);
  }
}
