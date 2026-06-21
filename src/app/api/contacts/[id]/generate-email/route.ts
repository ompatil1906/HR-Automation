import { generateEmail } from "@/lib/email";
import { fail, ok } from "@/lib/api";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { try { return ok(await generateEmail((await params).id)); } catch (error) { return fail(error); } }
