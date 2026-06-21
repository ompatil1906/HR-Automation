import { db } from "@/lib/db";
import { generateGeminiJson } from "@/lib/gemini";
import { companyResearchPrompt } from "@/prompts/companyResearchPrompt";
import { researchWithTavily } from "@/lib/tavily";
import { hiringLikelihood, priorityScore } from "@/lib/scoring";
import { normalizeCompanyName } from "@/lib/utils";
import { z } from "zod";

const researchSchema = z.object({
  company_name: z.string(), official_website: z.string().catch(""), linkedin_url: z.string().catch(""),
  industry: z.string().catch(""), company_type: z.string().catch(""), category: z.string(),
  products_services: z.string(), tech_focus: z.string(), company_background: z.string(),
  why_relevant_to_om: z.string(), possible_roles: z.array(z.string()), recommended_resume_angle: z.string(),
  personalization_points: z.array(z.string()), confidence_score: z.number().min(0).max(100),
  manual_review_required: z.boolean(), sources: z.array(z.string()), hiring_signals: z.array(z.string()).default([]),
});

export async function researchContact(contactId: string) {
  const contact = await db.contact.findUniqueOrThrow({ where: { id: contactId } });
  await db.contact.update({ where: { id: contactId }, data: { status: "RESEARCHING" } });
  try {
    const normalized = normalizeCompanyName(contact.companyName);
    const recent = await db.companyResearch.findFirst({ where: { normalizedCompanyName: normalized, updatedAt: { gte: new Date(Date.now() - 30 * 86400000) } }, orderBy: { updatedAt: "desc" } });
    let research = recent;
    if (!research) {
      const evidence = await researchWithTavily(contact.companyName);
      const parsed = researchSchema.parse(await generateGeminiJson(companyResearchPrompt(contact.companyName, evidence)));
      const confidence = parsed.confidence_score;
      research = await db.companyResearch.create({ data: {
        companyName: parsed.company_name || contact.companyName, normalizedCompanyName: normalized,
        officialWebsite: parsed.official_website || contact.companyWebsite, linkedinUrl: parsed.linkedin_url || contact.linkedinUrl,
        industry: parsed.industry, companyType: parsed.company_type, category: parsed.category,
        productsServices: parsed.products_services, techFocus: parsed.tech_focus, companyBackground: parsed.company_background,
        whyRelevantToOm: parsed.why_relevant_to_om, possibleRoles: parsed.possible_roles,
        recommendedResumeAngle: parsed.recommended_resume_angle, personalizationPoints: parsed.personalization_points,
        confidenceScore: confidence, manualReviewRequired: confidence < 60 || parsed.manual_review_required,
        sources: parsed.sources.filter((url) => evidence.some((item) => item.url === url)), hiringSignals: parsed.hiring_signals,
      }});
    }
    const score = priorityScore({ category: research.category, hasEmail: !!contact.hrEmail, emailValid: contact.emailValid,
      softwareRelevant: /ai|ml|software|data|cloud|tech|saas/i.test(`${research.industry} ${research.techFocus}`),
      hiringSignals: Array.isArray(research.hiringSignals) && research.hiringSignals.length > 0,
      hasWebPresence: !!(research.officialWebsite || research.linkedinUrl), isStartupOrProduct: /startup|product|saas/i.test(`${research.companyType} ${research.category}`),
      manualReviewRequired: research.manualReviewRequired, confidenceScore: research.confidenceScore });
    await db.contact.update({ where: { id: contactId }, data: { researchId: research.id, priorityScore: score, hiringLikelihood: hiringLikelihood(score), status: research.manualReviewRequired ? "MANUAL_REVIEW" : "RESEARCHED" } });
    await log(contactId, contact.campaignId, "COMPANY_RESEARCHED", "SUCCESS", `Research completed with ${research.confidenceScore}% confidence.`);
    return research;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    await db.contact.update({ where: { id: contactId }, data: { status: "FAILED" } });
    await log(contactId, contact.campaignId, "COMPANY_RESEARCHED", "FAILED", message);
    throw error;
  }
}

async function log(contactId: string, campaignId: string, action: string, status: string, message: string) {
  const contact = await db.contact.findUniqueOrThrow({ where: { id: contactId } });
  return db.activityLog.create({ data: { action, entityType: "Contact", entityId: contactId, contactId, campaignId, companyName: contact.companyName, hrEmail: contact.hrEmail, status, message } });
}
