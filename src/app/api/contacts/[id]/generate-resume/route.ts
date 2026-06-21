import { generateResume } from "@/lib/resume";
import { fail, ok } from "@/lib/api";
export const maxDuration = 60;
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { try { return ok(await generateResume((await params).id)); } catch (error) { return fail(error); } }
