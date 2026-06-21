import ExcelJS from "exceljs";
import Papa from "papaparse";
import { detectColumns, type ColumnKey } from "@/lib/column-detection";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { isValidEmail } from "@/lib/utils";
import { storeFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Choose an .xlsx, .xls, or .csv file");
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error("Only Excel and CSV files are accepted");
    const buffer = Buffer.from(await file.arrayBuffer());
    let rows: Record<string, unknown>[];
    if (/\.csv$/i.test(file.name)) {
      rows = Papa.parse<Record<string, unknown>>(buffer.toString("utf8"), { header: true, skipEmptyLines: "greedy" }).data;
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("The workbook contains no worksheets");
      const headers = sheet.getRow(1).values as unknown[];
      rows = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const record: Record<string, unknown> = {};
        for (let column = 1; column < headers.length; column++) {
          const header = String(headers[column] || "").trim();
          if (header) record[header] = row.getCell(column).text;
        }
        rows.push(record);
      });
    }
    rows = rows.filter((row) => Object.values(row).some((value) => String(value ?? "").trim()));
    if (!rows.length) throw new Error("The spreadsheet contains no data rows");
    const headers = Object.keys(rows[0]);
    const detected = detectColumns(headers);
    if (form.get("mode") === "preview") return ok({ headers, detected, preview: rows.slice(0, 20), totalRows: rows.length });
    const mapping = JSON.parse(String(form.get("mapping") || JSON.stringify(detected))) as Partial<Record<ColumnKey, string>>;
    if (!mapping.hrEmail || !mapping.companyName) throw new Error("Map both HR Email and Company Name before importing");
    const name = String(form.get("campaignName") || file.name.replace(/\.[^.]+$/, ""));
    const fileUrl = await storeFile(`uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`, buffer, file.type || "application/octet-stream");
    const contacts = rows.map((row) => {
      const get = (key: ColumnKey) => mapping[key] ? String(row[mapping[key]!] || "").trim() : "";
      const companyName = get("companyName");
      return { hrName: get("hrName") || null, hrEmail: get("hrEmail"), companyName, originalCompanyName: companyName, companyWebsite: get("companyWebsite") || null, linkedinUrl: get("linkedinUrl") || null, notes: get("notes") || null, emailValid: isValidEmail(get("hrEmail")), status: isValidEmail(get("hrEmail")) && companyName ? "IMPORTED" as const : "MANUAL_REVIEW" as const };
    });
    const campaign = await db.campaign.create({ data: { name, uploadedFileUrl: fileUrl, uploadedFileName: file.name, totalRows: contacts.length, status: "READY", notes: String(form.get("notes") || ""), contacts: { create: contacts } } });
    await db.activityLog.create({ data: { action: "CAMPAIGN_IMPORTED", entityType: "Campaign", entityId: campaign.id, campaignId: campaign.id, status: "SUCCESS", message: `${contacts.length} contacts imported; ${contacts.filter((c) => !c.emailValid).length} require email review.`, userAction: true } });
    return ok({ campaignId: campaign.id, totalRows: contacts.length }, 201);
  } catch (error) { return fail(error); }
}
