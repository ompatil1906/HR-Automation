import { createGmailDraft } from "@/lib/gmail";
import { fail, ok } from "@/lib/api";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { try { return ok(await createGmailDraft((await params).id)); } catch (error) { return fail(error); } }
