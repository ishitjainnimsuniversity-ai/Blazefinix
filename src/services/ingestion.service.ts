import Papa from "papaparse";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { CsvFeedbackRowSchema } from "@/lib/validation/csv.schema";
import { CsvImportResult, CsvRowError, FeedbackStatus, Sentiment, SimulatedIngestInput } from "@/types/api";
import { FeedbackService } from "./feedback.service";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { classifyFeedback } from "@/lib/ai/classifier";

export class IngestionService {
  /**
   * Ingests, validates, and processes a CSV string or buffer into feedback records.
   * Includes column aliasing, row-level validation, partial success handling, and vector generation.
   */
  static async importCsv(
    workspaceId: string,
    csvContent: string,
    options: {
      defaultSource?: string;
      skipAi?: boolean;
    } = {}
  ): Promise<CsvImportResult> {
    return this.ingestCsv(workspaceId, csvContent, options);
  }

  static async ingestCsv(
    workspaceId: string,
    csvContent: string,
    options: {
      defaultSource?: string;
      skipAi?: boolean;
    } = {}
  ): Promise<CsvImportResult> {
    if (!csvContent || !csvContent.trim()) {
      throw new ApiError(400, "BAD_REQUEST", "CSV content cannot be empty.");
    }

    // Size / Row Limit Guard (Max 10MB / 5,000 rows)
    const MAX_CSV_BYTES = 10 * 1024 * 1024;
    if (Buffer.byteLength(csvContent, "utf8") > MAX_CSV_BYTES) {
      throw new ApiError(413, "PAYLOAD_TOO_LARGE", "CSV content exceeds 10MB maximum limit.");
    }

    const parseResult = Papa.parse<Record<string, string>>(csvContent.trim(), {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase().replace(/[_\s-]/g, ""),
    });

    const errors: CsvRowError[] = [];

    // Issue A Fix: Capture parser-level errors immediately
    if (parseResult.errors && parseResult.errors.length > 0) {
      for (const err of parseResult.errors) {
        errors.push({
          rowNumber: (err.row ?? 0) + 1,
          data: {},
          reason: `CSV Parser Error: ${err.message}`,
        });
      }
    }

    const rows = parseResult.data;
    if (rows.length === 0 && errors.length > 0) {
      return {
        total: 0,
        successful: 0,
        failed: errors.length,
        createdIds: [],
        errors,
      };
    }

    const MAX_ROWS = 5000;
    if (rows.length > MAX_ROWS) {
      throw new ApiError(400, "BAD_REQUEST", `CSV contains ${rows.length} rows, which exceeds the 5,000 row maximum.`);
    }

    const validRows: Array<{
      rowNumber: number;
      rawText: string;
      source: string;
      customerName?: string;
      customerEmail?: string;
      status: FeedbackStatus;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +1 for 0-index, +1 for CSV header row

      // Column alias resolution
      const rawText =
        row["text"] ||
        row["feedback"] ||
        row["rawtext"] ||
        row["comment"] ||
        row["content"] ||
        row["message"] ||
        "";

      const source =
        row["source"] ||
        row["channel"] ||
        options.defaultSource ||
        "CSV Import";

      const customerName =
        row["customername"] ||
        row["name"] ||
        row["customer"] ||
        row["user"] ||
        null;

      const customerEmail =
        row["customeremail"] ||
        row["email"] ||
        row["useremail"] ||
        null;

      const rawStatus = (row["status"] || "NEW").toUpperCase();
      const status: FeedbackStatus = ["NEW", "REVIEWED", "RESOLVED", "ARCHIVED"].includes(rawStatus)
        ? (rawStatus as FeedbackStatus)
        : "NEW";

      const validation = CsvFeedbackRowSchema.safeParse({
        text: rawText,
        source,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        status,
      });

      if (!validation.success) {
        const errorMsg = validation.error.errors.map((e) => e.message).join("; ");
        errors.push({
          rowNumber,
          data: row,
          reason: errorMsg,
        });
      } else {
        validRows.push({
          rowNumber,
          rawText: validation.data.text,
          source: validation.data.source || options.defaultSource || "CSV Import",
          customerName: validation.data.customerName || undefined,
          customerEmail: validation.data.customerEmail || undefined,
          status: validation.data.status as FeedbackStatus,
        });
      }
    }

    const createdIds: string[] = [];

    // Batch process valid records
    for (const validItem of validRows) {
      try {
        const feedback = await prisma.feedback.create({
          data: {
            workspaceId,
            source: validItem.source,
            customerName: validItem.customerName || null,
            customerEmail: validItem.customerEmail || null,
            rawText: validItem.rawText,
            status: validItem.status,
            aiStatus: options.skipAi ? "COMPLETED" : "PENDING",
          },
        });

        createdIds.push(feedback.id);

        // Store dense embedding
        const embedding = generateEmbedding(validItem.rawText);
        await prisma.feedbackEmbedding.create({
          data: {
            feedbackId: feedback.id,
            workspaceId,
            embedding,
          },
        });

        // AI classification
        if (!options.skipAi) {
          const { result, model } = await classifyFeedback(validItem.rawText, validItem.source);

          await prisma.feedback.update({
            where: { id: feedback.id },
            data: {
              sentiment: result.sentiment as Sentiment,
              sentimentScore: result.sentimentScore,
              featureArea: result.featureArea,
              aiRationale: result.rationale,
              aiStatus: "COMPLETED",
            },
          });

          await prisma.aiAnalysis.create({
            data: {
              feedbackId: feedback.id,
              sentiment: result.sentiment as Sentiment,
              sentimentScore: result.sentimentScore,
              themes: result.themes,
              featureArea: result.featureArea,
              rationale: result.rationale,
              model,
              processingStatus: "COMPLETED",
            },
          });

          for (const themeName of result.themes) {
            const trimmed = themeName.trim();
            if (!trimmed) continue;

            const theme = await prisma.theme.upsert({
              where: {
                workspaceId_name: {
                  workspaceId,
                  name: trimmed,
                },
              },
              update: { count: { increment: 1 } },
              create: { workspaceId, name: trimmed, count: 1 },
            });

            await prisma.feedbackTheme.upsert({
              where: {
                feedbackId_themeId: {
                  feedbackId: feedback.id,
                  themeId: theme.id,
                },
              },
              update: {},
              create: {
                feedbackId: feedback.id,
                themeId: theme.id,
              },
            });
          }
        }
      } catch (insertError: any) {
        console.error(`[CSV Ingest Row Insert Error] Row #${validItem.rowNumber}:`, insertError);
        // Issue B Fix: Preserve exact CSV row number
        errors.push({
          rowNumber: validItem.rowNumber,
          data: { text: validItem.rawText },
          reason: `Database insertion failure: ${insertError.message}`,
        });
      }
    }

    return {
      total: rows.length,
      successful: createdIds.length,
      failed: errors.length,
      createdIds,
      errors,
    };
  }

  /**
   * Ingests feedback from a simulated integration channel (Website, Mobile App, Support, Survey, Social).
   */
  static async ingestSimulated(
    workspaceId: string,
    input: SimulatedIngestInput
  ) {
    return FeedbackService.createFeedback(workspaceId, {
      rawText: input.text,
      source: input.source,
      customerName: input.customerIdentifier,
      customerEmail: input.customerEmail,
      skipAi: input.skipAi,
    });
  }
}
