import { generateEmail } from "@/lib/email";
import { generateResume } from "@/lib/resume";
import { fail, ok } from "@/lib/api";
export async function POST(request: Request) { try { const { contactId } = await request.json(); if (!contactId) throw new Error("contactId is required"); const resume = await generateResume(contactId); const email = await generateEmail(contactId); return ok({ resume, email }); } catch (error) { return fail(error); } }
