import { createGmailDraft } from "@/lib/gmail";
import { fail, ok } from "@/lib/api";
export async function POST(request: Request) { try { const { contactId } = await request.json(); return ok(await createGmailDraft(contactId)); } catch (error) { return fail(error); } }
