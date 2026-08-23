import Papa from "papaparse";
import prisma from "@/lib/prisma";
import { CsvFeedbackRowSchema } from "@/lib/validation/csv.schema";
import { CsvImportErrorRow, CsvImportResult, SimulatedIngestInput } from "@/types/api";
import { FeedbackService } from "./feedback.service";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { classifyFeedback } from "@/lib/ai/classifier";

export class IngestionService {
  /**
   * Parses, validates, and bulk-inserts customer feedback from raw CSV content.
   * Tracks valid vs invalid rows with granular diagnostic error messages.
   */
  static async importCsv(
    workspaceId: string,
    csvContent: string,
    options: { defaultSource?: string; skipAi?: boolean } = {}
  ): Promise<CsvImportResult> {
    const parseResult = Papa.parse<Record<string, string>>(csvContent.trim(), {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""),
    });

    if (parseResult.errors && parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: parseResult.errors.length,
        createdIds: [],
        errors: parseResult.errors.map((err, idx) => ({
          rowNumber: err.row || idx + 1,
          data: {},
          reason: `CSV Parser Error: ${err.message}`,
        })),
      };
    }

    const rows = parseResult.data;
    const total = rows.length;
    const validRows: Array<{
      rawText: string;
      source: string;
      customerName?: string | null;
      customerEmail?: string | null;
      status: "NEW" | "REVIEWED" | "RESOLVED" | "ARCHIVED";
    }> = [];
    const errors: CsvImportErrorRow[] = [];

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
      const status = ["NEW", "REVIEWED", "RESOLVED", "ARCHIVED"].includes(rawStatus)
        ? (rawStatus as "NEW" | "REVIEWED" | "RESOLVED" | "ARCHIVED")
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
          rawText: validation.data.text,
          source: validation.data.source || options.defaultSource || "CSV Import",
          customerName: validation.data.customerName,
          customerEmail: validation.data.customerEmail,
          status: validation.data.status,
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

        // Store embedding
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
              sentiment: result.sentiment,
              sentimentScore: result.sentimentScore,
              featureArea: result.featureArea,
              aiRationale: result.rationale,
              aiStatus: "COMPLETED",
            },
          });

          await prisma.aiAnalysis.create({
            data: {
              feedbackId: feedback.id,
              sentiment: result.sentiment,
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
        console.error("[CSV Ingest Row Insert Error]:", insertError);
        errors.push({
          rowNumber: -1,
          data: { text: validItem.rawText },
          reason: `Database insertion failure: ${insertError.message}`,
        });
      }
    }

    return {
      total,
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
