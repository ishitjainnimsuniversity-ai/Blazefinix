import { describe, it, expect } from "vitest";
import Papa from "papaparse";
import { CsvFeedbackRowSchema } from "../src/lib/validation/csv.schema";

describe("CSV Bulk Ingestion Pipeline", () => {
  it("should correctly parse CSV data and map diverse column aliases", () => {
    const csvString = `
feedback,channel,user,email,status
"App crashed when loading the VOC report",App,Alice Smith,alice@example.com,NEW
"Payment failed with timeout error",Website,Bob Jones,bob@example.com,REVIEWED
"Support responded in 5 minutes",Support,Charlie,charlie@example.com,RESOLVED
    `.trim();

    const parsed = Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""),
    });

    expect(parsed.data.length).toBe(3);

    for (const row of parsed.data) {
      const text = row["text"] || row["feedback"] || row["content"] || "";
      const source = row["source"] || row["channel"] || "CSV Import";
      const customerName = row["customername"] || row["user"] || null;
      const customerEmail = row["customeremail"] || row["email"] || null;
      const status = row["status"] || "NEW";

      const validation = CsvFeedbackRowSchema.safeParse({
        text,
        source,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        status,
      });

      expect(validation.success).toBe(true);
    }
  });

  it("should flag invalid or empty rows without dropping the entire batch", () => {
    const csvString = `
text,source,customerEmail
"Valid feedback item #1",Website,user1@test.com
"",App,user2@test.com
"Valid feedback item #2",Support,invalid-email-string
"Valid feedback item #3",Survey,user3@test.com
    `.trim();

    const parsed = Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""),
    });

    const validRows: any[] = [];
    const errors: any[] = [];

    parsed.data.forEach((row, idx) => {
      const validation = CsvFeedbackRowSchema.safeParse({
        text: row["text"] || "",
        source: row["source"] || "CSV Import",
        customerEmail: row["customeremail"] || undefined,
      });

      if (validation.success) {
        validRows.push(validation.data);
      } else {
        errors.push({ rowNumber: idx + 2, reason: validation.error.errors[0].message });
      }
    });

    expect(validRows.length).toBe(2);
    expect(errors.length).toBe(2);
    expect(errors[0].reason).toContain("Feedback text");
    expect(errors[1].reason).toContain("Invalid email format");
  });
});
