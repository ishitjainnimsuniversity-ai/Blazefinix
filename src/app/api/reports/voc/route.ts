import { NextRequest } from "next/server";
import { getAuthSession, requireRole } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { GenerateVocReportSchema } from "@/lib/validation/voc-report.schema";
import { VocReportService } from "@/services/voc-report.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/reports/voc
 * Lists all generated Voice-of-Customer reports for the workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const reports = await VocReportService.listReports(session.workspaceId);
    return apiSuccess(reports);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/reports/voc
 * Generates and stores a new Voice-of-Customer report with AI executive narrative.
 * RBAC: ADMIN, ANALYST
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ["ADMIN", "ANALYST"]);

    const body = await req.json().catch(() => ({}));
    const input = GenerateVocReportSchema.parse(body);

    const report = await VocReportService.generateReport(session.workspaceId, input);
    return apiSuccess(report, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
