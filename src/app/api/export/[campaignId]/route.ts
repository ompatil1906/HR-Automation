import { db } from "@/lib/db";
import { fail } from "@/lib/api";
import { fetchFile } from "@/lib/storage";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import JSZip from "jszip";

function trackerRows(campaign: Awaited<ReturnType<typeof load>>) {
  return campaign.contacts.map((c, index) => { const r = c.research; const resume = c.generatedResumes[0]; const email = c.generatedEmails[0]; const draft = c.gmailDrafts[0]; const sent = c.sentEmails[0]; return {
    "Row ID": index + 1, "HR Name": c.hrName, "HR Email": c.hrEmail, "Company Name": c.companyName, "Original Company Name": c.originalCompanyName, "Company Website": c.companyWebsite, "LinkedIn URL": c.linkedinUrl,
    Category: r?.category, Industry: r?.industry, "Company Type": r?.companyType, "Company Background": r?.companyBackground, "Tech Focus": r?.techFocus, "Recommended Resume Angle": r?.recommendedResumeAngle, "Target Roles": Array.isArray(r?.possibleRoles) ? r.possibleRoles.join(", ") : "",
    "Priority Score": c.priorityScore, "Hiring Likelihood": c.hiringLikelihood, "Research Confidence Score": r?.confidenceScore, "Resume PDF Path": resume?.pdfFileUrl, "Resume TEX Path": resume?.texFileUrl, "Resume Compile Status": resume?.compileStatus,
    "Email Subject": email?.subject, "Email Body": email?.body, "Follow-up Email": email?.followUpBody, "Gmail Draft Status": draft?.status, "Gmail Draft ID": draft?.gmailDraftId, "Send Status": sent?.status, "Sent Date": sent?.sentAt?.toISOString(), "Response Status": "", "Manual Review Required": !!(r?.manualReviewRequired || email?.manualReviewRequired) && !c.manualReviewResolved, "Error Message": resume?.errorMessage || sent?.errorMessage, Notes: c.notes,
  }; });
}

async function load(id: string) { return db.campaign.findUniqueOrThrow({ where: { id }, include: { contacts: { include: { research: true, generatedResumes: { take: 1, orderBy: { createdAt: "desc" } }, generatedEmails: { take: 1, orderBy: { createdAt: "desc" } }, gmailDrafts: { take: 1, orderBy: { createdAt: "desc" } }, sentEmails: { take: 1, orderBy: { createdAt: "desc" } } } } } }); }

export async function GET(request: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  try {
    const campaign = await load((await params).campaignId); const format = new URL(request.url).searchParams.get("format") || "xlsx"; const safe = campaign.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    if (format === "resumes") { const zip = new JSZip(); for (const c of campaign.contacts) { const resume = c.generatedResumes[0]; if (resume?.pdfFileUrl) zip.file(resume.fileName, await fetchFile(resume.pdfFileUrl)); } return new Response(Buffer.from(await zip.generateAsync({ type: "uint8array" })), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${safe}_resumes.zip"` } }); }
    const rows = trackerRows(campaign);
    if (format === "emails") { const csv = Papa.unparse(rows.map((r) => ({ "HR Email": r["HR Email"], "Company Name": r["Company Name"], "Email Subject": r["Email Subject"], "Email Body": r["Email Body"], "Follow-up Email": r["Follow-up Email"] }))); return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${safe}_emails.csv"` } }); }
    if (format === "logs") { const logs = await db.activityLog.findMany({ where: { campaignId: campaign.id }, orderBy: { createdAt: "desc" } }); const csv = Papa.unparse(logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() }))); return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${safe}_logs.csv"` } }); }
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet("Tracker"); if (rows.length) { sheet.columns = Object.keys(rows[0]).map((header) => ({ header, key: header, width: Math.min(55, Math.max(14, header.length + 2)) })); sheet.addRows(rows); sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: "frozen", ySplit: 1 }]; sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Object.keys(rows[0]).length } }; } const output = await workbook.xlsx.writeBuffer(); return new Response(Buffer.from(output), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${safe}_tracker.xlsx"` } });
  } catch (error) { return fail(error, 404); }
}
