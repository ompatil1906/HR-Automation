import { sendGmailEmail } from "@/lib/gmail";
import { fail, ok } from "@/lib/api";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const body = await request.json(); if (body.confirm !== "CONFIRM") throw new Error("Type CONFIRM to send this email"); return ok(await sendGmailEmail((await params).id)); } catch (error) { return fail(error); } }
