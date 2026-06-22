import { Client } from "@upstash/qstash";
import { db } from "@/lib/db";
import { researchContact } from "@/lib/research";
import { generateResume } from "@/lib/resume";
import { generateEmail } from "@/lib/email";

function productionBaseUrl() {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.NEXTAUTH_URL && !/localhost|127\.0\.0\.1/i.test(process.env.NEXTAUTH_URL)) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}

export async function queueCampaignAutomation(campaignId: string, contactIds?: string[]) {
  const contacts = await db.contact.findMany({
    where: {
      campaignId,
      ...(contactIds?.length ? { id: { in: contactIds } } : {}),
      status: { notIn: ["SENT", "SKIPPED"] },
    },
    select: { id: true, hrEmail: true, emailValid: true, companyName: true, jobs: { where: { type: "AUTOMATE_CONTACT", status: { in: ["PENDING", "PROCESSING"] } }, select: { id: true } } },
  });

  const eligible = contacts.filter(contact => contact.emailValid && contact.hrEmail && contact.companyName && !contact.jobs.length);
  const jobs = await db.$transaction(eligible.map(contact => db.backgroundJob.create({ data: {
    type: "AUTOMATE_CONTACT", contactId: contact.id, status: "PENDING", payload: { campaignId },
  } })));

  if (jobs.length) await db.campaign.update({ where: { id: campaignId }, data: { status: "PROCESSING" } });
  const base = productionBaseUrl();
  if (jobs.length && process.env.QSTASH_TOKEN && process.env.NEXTAUTH_SECRET && base) {
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    await Promise.all(jobs.map((job, index) => client.publishJSON({
      url: `${base}/api/jobs/process`, body: { jobId: job.id }, delay: index * 2,
      headers: { Authorization: `Bearer ${process.env.NEXTAUTH_SECRET}` },
    })));
    return { queued: jobs.length, skipped: contacts.length - eligible.length, mode: "qstash" as const, jobIds: jobs.map(job => job.id) };
  }
  return { queued: jobs.length, skipped: contacts.length - eligible.length, mode: "after-response" as const, jobIds: jobs.map(job => job.id) };
}

export async function processAutomationJob(jobId: string) {
  const claimed = await db.backgroundJob.updateMany({ where: { id: jobId, type: "AUTOMATE_CONTACT", status: "PENDING" }, data: { status: "PROCESSING", attempts: { increment: 1 } } });
  if (!claimed.count) return db.backgroundJob.findUniqueOrThrow({ where: { id: jobId } });
  const job = await db.backgroundJob.findUniqueOrThrow({ where: { id: jobId } });
  if (!job.contactId) throw new Error("Automation job has no contact");

  try {
    let contact = await db.contact.findUniqueOrThrow({ where: { id: job.contactId }, include: { research: true, generatedResumes: { where: { compileStatus: "COMPLETED" }, take: 1 }, generatedEmails: { take: 1 } } });
    if (!contact.emailValid || !contact.companyName) {
      await db.contact.update({ where: { id: contact.id }, data: { status: "MANUAL_REVIEW" } });
      throw new Error("Contact needs a valid email and company name");
    }

    if (!contact.research) await researchContact(contact.id);
    contact = await db.contact.findUniqueOrThrow({ where: { id: contact.id }, include: { research: true, generatedResumes: { where: { compileStatus: "COMPLETED" }, take: 1 }, generatedEmails: { take: 1 } } });
    if (contact.research?.manualReviewRequired && !contact.manualReviewResolved) {
      await db.backgroundJob.update({ where: { id: jobId }, data: { status: "COMPLETED", payload: { ...(job.payload as object), stoppedAt: "RESEARCH_REVIEW" } } });
      return job;
    }

    if (!contact.generatedResumes.length) await generateResume(contact.id);
    if (!contact.generatedEmails.length) await generateEmail(contact.id);
    const email = await db.generatedEmail.findFirst({ where: { contactId: contact.id }, orderBy: { createdAt: "desc" } });
    await db.contact.update({ where: { id: contact.id }, data: { status: email?.manualReviewRequired ? "MANUAL_REVIEW" : "GENERATED" } });
    const completed = await db.backgroundJob.update({ where: { id: jobId }, data: { status: "COMPLETED" } });
    await finishCampaignIfIdle(contact.campaignId);
    return completed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation failed";
    await db.backgroundJob.update({ where: { id: jobId }, data: { status: "FAILED", errorMessage: message } });
    const contact = job.contactId ? await db.contact.findUnique({ where: { id: job.contactId }, select: { campaignId: true, status: true } }) : null;
    if (job.contactId && contact && contact.status !== "MANUAL_REVIEW") await db.contact.update({ where: { id: job.contactId }, data: { status: "FAILED" } });
    if (contact) await finishCampaignIfIdle(contact.campaignId);
    throw error;
  }
}

async function finishCampaignIfIdle(campaignId: string) {
  const pending = await db.backgroundJob.count({ where: { type: "AUTOMATE_CONTACT", contact: { campaignId }, status: { in: ["PENDING", "PROCESSING"] } } });
  if (!pending) await db.campaign.update({ where: { id: campaignId }, data: { status: "READY" } });
}

export async function processAutomationJobs(jobIds: string[]) {
  for (const jobId of jobIds) {
    try { await processAutomationJob(jobId); } catch { /* failure is persisted per contact */ }
  }
}

export async function automationStatus(campaignId: string) {
  const [pending, processing, completed, failed] = await Promise.all([
    db.backgroundJob.count({ where: { type: "AUTOMATE_CONTACT", contact: { campaignId }, status: "PENDING" } }),
    db.backgroundJob.count({ where: { type: "AUTOMATE_CONTACT", contact: { campaignId }, status: "PROCESSING" } }),
    db.backgroundJob.count({ where: { type: "AUTOMATE_CONTACT", contact: { campaignId }, status: "COMPLETED" } }),
    db.backgroundJob.count({ where: { type: "AUTOMATE_CONTACT", contact: { campaignId }, status: "FAILED" } }),
  ]);
  return { pending, processing, completed, failed, active: pending + processing };
}
