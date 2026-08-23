import { NextRequest } from "next/server";
import { getAuthSession, requireRole } from "@/lib/auth";
import { apiSuccess, handleApiError, ApiError } from "@/lib/api-response";
import { IngestionService } from "@/services/ingestion.service";
import { CsvUploadPayloadSchema } from "@/lib/validation/csv.schema";

export const dynamic = "force-dynamic";

/**
 * POST /api/ingest/csv
 * Bulk imports feedback records from CSV string or multipart/form-data upload.
 * RBAC: ADMIN, ANALYST
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ["ADMIN", "ANALYST"]);

    const contentType = req.headers.get("content-type") || "";
    let csvContent = "";
    let defaultSource = "CSV Import";
    let skipAi = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        throw new ApiError(400, "BAD_REQUEST", "No CSV file found in form data.");
      }
      csvContent = await file.text();
      defaultSource = (formData.get("source") as string) || "CSV Import";
      skipAi = formData.get("skipAi") === "true";
    } else {
      const body = await req.json();
      const input = CsvUploadPayloadSchema.parse(body);
      csvContent = input.csvContent;
      defaultSource = input.source || "CSV Import";
      skipAi = input.skipAi || false;
    }

    if (!csvContent || csvContent.trim().length === 0) {
      throw new ApiError(400, "BAD_REQUEST", "CSV content is empty.");
    }

    const result = await IngestionService.importCsv(session.workspaceId, csvContent, {
      defaultSource,
      skipAi,
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
