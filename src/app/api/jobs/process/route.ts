import { processSendJob } from "@/lib/send-queue";
import { fail, ok } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!process.env.NEXTAUTH_SECRET || authorization !== `Bearer ${process.env.NEXTAUTH_SECRET}`) return fail(new Error("Unauthorized job callback"), 401);
    const body = await request.json();
    if (!body.jobId) throw new Error("jobId is required");
    return ok(await processSendJob(body.jobId));
  } catch (error) { return fail(error); }
}
