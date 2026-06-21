import { fail, ok } from "@/lib/api";
import { queueApprovedSends } from "@/lib/send-queue";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    if (body.confirm !== "CONFIRM") throw new Error("Type CONFIRM to queue approved emails");
    if (!Array.isArray(body.contactIds) || !body.contactIds.length) throw new Error("Select at least one approved row");
    return ok(await queueApprovedSends((await params).id, body.contactIds));
  } catch (error) { return fail(error); }
}
