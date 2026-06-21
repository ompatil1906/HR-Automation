import { sendGmailEmail } from "@/lib/gmail";
import { fail, ok } from "@/lib/api";
export async function POST(request: Request) { try { const { contactId, confirm } = await request.json(); if (confirm !== "CONFIRM") throw new Error("Type CONFIRM to send"); return ok(await sendGmailEmail(contactId)); } catch (error) { return fail(error); } }
