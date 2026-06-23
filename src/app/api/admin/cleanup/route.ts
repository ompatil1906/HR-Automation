import { NextRequest } from "next/server";
import { ContactStatus, CampaignStatus } from "@prisma/client";
import { ok, fail } from "@/lib/api";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";

function hasAdminBearer(request: NextRequest) {
  const header = request.headers.get("authorization");
  return [process.env.NEXTAUTH_SECRET, process.env.COLDMAILOS_CLEANUP_TOKEN].some((token) => token && header === `Bearer ${token}`);
}

async function requireAdmin(request: NextRequest) {
  if (hasAdminBearer(request)) return;
  const token = request.cookies.get("coldmailos_session")?.value;
  if (!token) throw new Error("Unauthorized");
  await verifySession(token);
}

function recoveredStatus(contact: { researchId: string | null; generatedEmails: { id: string }[]; generatedResumes: { id: string }[] }) {
  if (contact.generatedEmails.length) return ContactStatus.GENERATED;
  if (contact.generatedResumes.length || contact.researchId) return ContactStatus.RESEARCHED;
  return ContactStatus.IMPORTED;
}

const providerFailureCodes = new Set(["GEMINI_SPEND_CAP", "GEMINI_RATE_LIMIT", "GEMINI_HIGH_DEMAND", "PROVIDER_ERROR"]);

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const resetAutomation = body.resetAutomation !== false;

    const result = await db.$transaction(async (tx) => {
      const before = {
        activityLogs: await tx.activityLog.count(),
        automationJobs: await tx.backgroundJob.count({ where: { type: "AUTOMATE_CONTACT" } }),
        stuckCampaigns: await tx.campaign.count({ where: { status: { in: [CampaignStatus.PROCESSING, CampaignStatus.PAUSED, CampaignStatus.FAILED] }, contacts: { some: { jobs: { some: { type: "AUTOMATE_CONTACT" } } } } } }),
      };

      let resetContacts = 0;
      let resetCampaigns = 0;

      if (resetAutomation) {
        const failedProviderJobs = await tx.backgroundJob.findMany({
          where: { type: "AUTOMATE_CONTACT", status: "FAILED", contactId: { not: null } },
          select: { contactId: true, payload: true },
        });
        const providerFailedContactIds = [
          ...new Set(
            failedProviderJobs
              .filter((job) => providerFailureCodes.has((job.payload as { failureCode?: string })?.failureCode || ""))
              .map((job) => job.contactId)
              .filter((id): id is string => !!id),
          ),
        ];

        const contacts = await tx.contact.findMany({
          where: {
            jobs: { some: { type: "AUTOMATE_CONTACT" } },
            OR: [
              { status: { in: [ContactStatus.RESEARCHING, ContactStatus.GENERATING, ContactStatus.FAILED] } },
              providerFailedContactIds.length ? { id: { in: providerFailedContactIds }, status: ContactStatus.MANUAL_REVIEW } : { id: "__never__" },
            ],
          },
          select: {
            id: true,
            researchId: true,
            generatedEmails: { take: 1, select: { id: true } },
            generatedResumes: { where: { compileStatus: "COMPLETED" }, take: 1, select: { id: true } },
          },
        });

        for (const contact of contacts) {
          await tx.contact.update({ where: { id: contact.id }, data: { status: recoveredStatus(contact) } });
        }
        resetContacts = contacts.length;

        const campaigns = await tx.campaign.findMany({
          where: {
            status: { in: [CampaignStatus.PROCESSING, CampaignStatus.PAUSED, CampaignStatus.FAILED] },
            contacts: { some: { jobs: { some: { type: "AUTOMATE_CONTACT" } } } },
          },
          select: { id: true },
        });

        if (campaigns.length) {
          const updated = await tx.campaign.updateMany({ where: { id: { in: campaigns.map((campaign) => campaign.id) } }, data: { status: CampaignStatus.READY } });
          resetCampaigns = updated.count;
        }
      }

      const deletedAutomationJobs = await tx.backgroundJob.deleteMany({ where: { type: "AUTOMATE_CONTACT" } });
      const deletedActivityLogs = await tx.activityLog.deleteMany();

      return {
        before,
        deleted: {
          activityLogs: deletedActivityLogs.count,
          automationJobs: deletedAutomationJobs.count,
        },
        reset: {
          contacts: resetContacts,
          campaigns: resetCampaigns,
        },
      };
    });

    return ok({ success: true, ...result });
  } catch (error) {
    return fail(error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}
