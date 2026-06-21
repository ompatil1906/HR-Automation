import { researchContact } from "@/lib/research";
import { fail, ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { try { return ok(await researchContact((await params).id)); } catch (error) { return fail(error); } }

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const body = await request.json();
    const contact = await db.contact.findUniqueOrThrow({ where: { id }, include: { research: true } });
    if (!contact.research) throw new Error("Research does not exist");
    const research = await db.companyResearch.update({ where: { id: contact.research.id }, data: { officialWebsite: body.officialWebsite, linkedinUrl: body.linkedinUrl, industry: body.industry, companyType: body.companyType, category: body.category, productsServices: body.productsServices, techFocus: body.techFocus, companyBackground: body.companyBackground, whyRelevantToOm: body.whyRelevantToOm, recommendedResumeAngle: body.recommendedResumeAngle, personalizationPoints: body.personalizationPoints, possibleRoles: body.possibleRoles, manualReviewRequired: body.manualReviewRequired } });
    if (body.resolveManualReview) await db.contact.update({ where: { id }, data: { manualReviewResolved: true, status: "RESEARCHED" } });
    await db.activityLog.create({ data: { action: "COMPANY_RESEARCH_EDITED", entityType: "CompanyResearch", entityId: research.id, contactId: id, campaignId: contact.campaignId, companyName: contact.companyName, hrEmail: contact.hrEmail, status: "SUCCESS", message: "Research was manually edited and reviewed.", userAction: true } });
    return ok(research);
  } catch (error) { return fail(error); }
}
