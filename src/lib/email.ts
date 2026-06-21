import { db } from "@/lib/db";
import { getOrCreateProfile } from "@/lib/profile";
import { generateGeminiJson } from "@/lib/gemini";
import { emailGenerationPrompt } from "@/prompts/emailGenerationPrompt";
import { qualityCheckPrompt } from "@/prompts/qualityCheckPrompt";
import { z } from "zod";

const schema = z.object({ subject: z.string().max(140), body: z.string().max(4000), followUpBody: z.string().max(3000), personalizationLine: z.string(), targetRole: z.string(), confidenceScore: z.number().min(0).max(100), manualReviewRequired: z.boolean() });
const auditSchema = z.object({ pass: z.boolean(), reasons: z.array(z.string()), riskScore: z.number().min(0).max(100) });

export async function generateEmail(contactId: string) {
  const contact = await db.contact.findUniqueOrThrow({ where: { id: contactId }, include: { research: true } });
  if (!contact.research) throw new Error("Research the company before generating an email");
  const profile = await getOrCreateProfile();
  const generated = schema.parse(await generateGeminiJson(emailGenerationPrompt({ profile, contact, research: contact.research })));
  const audit = auditSchema.parse(await generateGeminiJson(qualityCheckPrompt({ company: contact.companyName, verifiedResearch: contact.research, profile, generatedEmail: generated })));
  const companyMentioned = generated.body.toLowerCase().includes(contact.companyName.toLowerCase());
  const tooLong = generated.body.trim().split(/\s+/).length > 220;
  const manualReview = generated.manualReviewRequired || contact.research.manualReviewRequired || !companyMentioned || tooLong || !audit.pass;
  const email = await db.generatedEmail.create({ data: { contactId, ...generated, manualReviewRequired: manualReview, qualityCheck: { pass: !manualReview, riskScore: audit.riskScore, reasons: [...audit.reasons, ...[!companyMentioned && "Company name is missing", tooLong && "Email exceeds 220 words", contact.research.manualReviewRequired && "Research requires manual review"].filter(Boolean)] } } });
  await db.activityLog.create({ data: { action: "EMAIL_GENERATED", entityType: "GeneratedEmail", entityId: email.id, contactId, campaignId: contact.campaignId, companyName: contact.companyName, hrEmail: contact.hrEmail, status: manualReview ? "MANUAL_REVIEW" : "SUCCESS", message: manualReview ? "Generated with review warnings." : "Email generated and deterministic checks passed." } });
  return email;
}
