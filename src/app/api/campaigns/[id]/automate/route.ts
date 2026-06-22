import { after, NextRequest } from "next/server";
import { automationStatus, processAutomationJobs, queueCampaignAutomation } from "@/lib/automation";
import { fail, ok } from "@/lib/api";

export const maxDuration = 60;

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { return ok(await automationStatus((await params).id)); } catch (error) { return fail(error); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json().catch(() => ({}));
    const queued = await queueCampaignAutomation((await params).id, Array.isArray(body.contactIds) ? body.contactIds : undefined);
    if (queued.mode === "after-response" && queued.jobIds.length) after(() => processAutomationJobs(queued.jobIds));
    return ok(queued, 202);
  } catch (error) { return fail(error); }
}
