import { Client } from "@upstash/qstash";
import { db } from "@/lib/db";
import { getOrCreateProfile } from "@/lib/profile";
import { sendGmailEmail } from "@/lib/gmail";
import { sleep } from "@/lib/utils";

export async function queueApprovedSends(campaignId: string, contactIds: string[]) {
  const profile = await getOrCreateProfile();
  if (profile.draftOnlyMode) throw new Error("Disable draft-only mode before sending");
  const contacts = await db.contact.findMany({ where: { campaignId, id: { in: contactIds }, generatedEmails: { some: { approved: true } } }, select: { id: true } });
  if (!contacts.length) throw new Error("No approved contacts were selected");
  const jobs = await Promise.all(contacts.map((contact, index) => db.backgroundJob.create({ data: { type: "SEND_EMAIL", contactId: contact.id, payload: { campaignId }, status: "PENDING" } }).then((job) => ({ job, index }))));
  if (process.env.QSTASH_TOKEN && (process.env.NEXTAUTH_URL || process.env.VERCEL_URL)) {
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    const base = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`;
    await Promise.all(jobs.map(({ job, index }) => client.publishJSON({ url: `${base}/api/jobs/process`, body: { jobId: job.id }, delay: index * profile.sendDelaySeconds, headers: { Authorization: `Bearer ${process.env.NEXTAUTH_SECRET}` } })));
    return { queued: jobs.length, mode: "qstash" };
  }
  const results: Array<{ id: string; status: string; error?: string }> = [];
  for (const { job, index } of jobs) {
    if (index) await sleep(profile.sendDelaySeconds * 1000);
    try { await processSendJob(job.id); results.push({ id: job.id, status: "sent" }); }
    catch (error) { results.push({ id: job.id, status: "failed", error: error instanceof Error ? error.message : "Unknown error" }); }
  }
  return { queued: jobs.length, mode: "inline", results };
}

export async function processSendJob(jobId: string) {
  const job = await db.backgroundJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.status === "COMPLETED") return job;
  if (!job.contactId || job.type !== "SEND_EMAIL") throw new Error("Invalid send job");
  const payload = job.payload as { campaignId?: string };
  if (payload.campaignId) {
    const campaignJobs = await db.backgroundJob.findMany({ where: { type: "SEND_EMAIL", contact: { campaignId: payload.campaignId }, status: { in: ["COMPLETED", "FAILED"] } }, select: { status: true } });
    const failed = campaignJobs.filter((item) => item.status === "FAILED").length;
    if (campaignJobs.length >= 3 && failed / campaignJobs.length >= 0.5) {
      await db.campaign.update({ where: { id: payload.campaignId }, data: { status: "PAUSED" } });
      await db.backgroundJob.update({ where: { id: jobId }, data: { status: "FAILED", errorMessage: "Campaign paused because the send error rate reached 50%." } });
      throw new Error("Send queue paused after a high error rate");
    }
  }
  await db.backgroundJob.update({ where: { id: jobId }, data: { status: "PROCESSING", attempts: { increment: 1 } } });
  try { await sendGmailEmail(job.contactId); return db.backgroundJob.update({ where: { id: jobId }, data: { status: "COMPLETED" } }); }
  catch (error) { const message = error instanceof Error ? error.message : "Send failed"; await db.backgroundJob.update({ where: { id: jobId }, data: { status: "FAILED", errorMessage: message } }); throw error; }
}

export function buildSendSchedule(contactIds: string[], delaySeconds: number) {
  return contactIds.map((contactId, index) => ({ contactId, delaySeconds: index * Math.max(5, delaySeconds) }));
}
