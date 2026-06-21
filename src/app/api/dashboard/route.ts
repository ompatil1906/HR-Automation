import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    const [contacts, companies, researched, emails, resumes, drafts, sent, review, failed, categories, priority, logs] = await Promise.all([
      db.contact.count(), db.contact.groupBy({ by: ["companyName"] }).then((r) => r.length), db.contact.count({ where: { researchId: { not: null } } }), db.generatedEmail.count(), db.generatedResume.count({ where: { compileStatus: "COMPLETED" } }), db.gmailDraft.count({ where: { status: "CREATED" } }), db.sentEmail.count({ where: { status: "SENT" } }), db.contact.count({ where: { status: "MANUAL_REVIEW" } }), db.contact.count({ where: { status: "FAILED" } }),
      db.companyResearch.groupBy({ by: ["category"], _count: { category: true } }), db.contact.findMany({ take: 8, orderBy: { priorityScore: "desc" }, include: { research: true, generatedEmails: { take: 1, orderBy: { createdAt: "desc" } } } }), db.activityLog.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { campaign: { select: { name: true } } } }),
    ]);
    return ok({ stats: { contacts, companies, researched, emails, resumes, drafts, sent, review, failed }, categories: categories.map((x) => ({ name: x.category, value: x._count.category })), priority, logs });
  } catch (error) { return fail(error, 500); }
}
