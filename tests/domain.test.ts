import { afterEach, describe, expect, it, vi } from "vitest";
import { detectColumns } from "@/lib/column-detection";
import { isValidEmail, matchesResumeCompany, normalizeCompanyName, resumeFileName, sanitizeCompanyForFilename } from "@/lib/utils";
import { hiringLikelihood, priorityScore } from "@/lib/scoring";
import { parseGeminiJson } from "@/lib/gemini";
import { dedupeTavilyResults } from "@/lib/tavily";
import { buildGmailRaw } from "@/lib/gmail";
import { buildSendSchedule } from "@/lib/send-queue";
import { emailGenerationPrompt } from "@/prompts/emailGenerationPrompt";
import { getGmailRedirectUri } from "@/lib/gmail-oauth";
import { isPdfBuffer } from "@/lib/pdf";
import { deliverabilityReasons } from "@/lib/quality";

afterEach(() => vi.unstubAllEnvs());

describe("spreadsheet column detection", () => {
  it("maps common HR spreadsheet headings", () => expect(detectColumns(["Recruiter Name", "Work Email", "Organisation Name", "Company LinkedIn", "Remarks"])).toEqual({ hrName: "Recruiter Name", hrEmail: "Work Email", companyName: "Organisation Name", linkedinUrl: "Company LinkedIn", notes: "Remarks" }));
});

describe("contact and company normalization", () => {
  it("validates practical email addresses", () => { expect(isValidEmail("hr@example.co.in")).toBe(true); expect(isValidEmail("not-an-email")).toBe(false); });
  it("normalizes legal suffixes", () => expect(normalizeCompanyName("Impact Analytics Pvt. Ltd.")).toBe("impact analytics"));
  it("creates safe exact filenames", () => { expect(sanitizeCompanyForFilename("ACME / India & Co.")).toBe("ACME_India_Co"); expect(resumeFileName("Impact Analytics")).toBe("Om_Patil_Resume_Impact_Analytics.pdf"); expect(matchesResumeCompany("Om_Patil_Resume_Other.pdf", "Impact Analytics")).toBe(false); });
});

describe("research parsing and scoring", () => {
  it("deduplicates Tavily sources by URL", () => expect(dedupeTavilyResults([[{ title: "A", url: "https://a.com", content: "a" }],[{ title: "A2", url: "https://a.com", content: "b" }]])).toHaveLength(1));
  it("parses fenced Gemini JSON", () => expect(parseGeminiJson<{ confidence: number }>("```json\n{\"confidence\":72}\n```").confidence).toBe(72));
  it("applies bonuses, penalties, cap, and likelihood", () => { const score=priorityScore({category:"AI/ML Company",hasEmail:true,emailValid:true,softwareRelevant:true,hiringSignals:true,hasWebPresence:true,isStartupOrProduct:true,manualReviewRequired:false,confidenceScore:90}); expect(score).toBe(100); expect(hiringLikelihood(score)).toBe("Very High"); });
  it("penalizes unsafe low-confidence rows", () => expect(priorityScore({category:"Unknown / Needs Manual Review",hasEmail:true,emailValid:false,softwareRelevant:false,hiringSignals:false,hasWebPresence:false,isStartupOrProduct:false,manualReviewRequired:true,confidenceScore:30})).toBe(10));
});

describe("generation and delivery safeguards", () => {
  it("email prompt forbids invented facts and constrains length", () => { const prompt=emailGenerationPrompt({profile:{name:"Om"},contact:{companyName:"Acme"},research:{confidenceScore:80}}); expect(prompt).toContain("Do not invent facts"); expect(prompt).toContain("under 220 words"); });
  it("builds an individual MIME payload with the matched attachment", () => { const raw=buildGmailRaw({to:"hr@acme.com",from:"om@example.com",subject:"Application",body:"Hello Acme",attachmentName:"Om_Patil_Resume_Acme.pdf",attachment:Buffer.from("pdf")}); const decoded=Buffer.from(raw,"base64url").toString(); expect(decoded).toContain("To: hr@acme.com"); expect(decoded).toContain("filename=\"Om_Patil_Resume_Acme.pdf\""); expect(decoded).not.toContain("Bcc:"); });
  it("schedules one contact per delayed job", () => expect(buildSendSchedule(["a","b","c"],30)).toEqual([{contactId:"a",delaySeconds:0},{contactId:"b",delaySeconds:30},{contactId:"c",delaySeconds:60}]));
  it("never uses a localhost Gmail callback in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GOOGLE_REDIRECT_URI", "http://localhost:3000/api/gmail/oauth/callback");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "coldmailos.vercel.app");
    expect(getGmailRedirectUri()).toBe("https://coldmailos.vercel.app/api/gmail/oauth/callback");
  });
  it("rejects HTML or error pages stored as resume PDFs", () => {
    expect(isPdfBuffer(Buffer.from("%PDF-1.7\n"))).toBe(true);
    expect(isPdfBuffer(Buffer.from("<html>Not found</html>"))).toBe(false);
  });
  it("flags obvious deliverability risks before draft or send", () => {
    expect(deliverabilityReasons("ACT NOW!!!", "Click here! This is guaranteed and 100% free!").length).toBeGreaterThan(0);
    expect(deliverabilityReasons("Application for AI Engineer | Om Patil", "Hello, I am writing regarding Acme and a relevant engineering opportunity.")).toEqual([]);
  });
});
