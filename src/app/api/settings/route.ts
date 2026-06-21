import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { encryptSecret } from "@/lib/crypto";
import { getOrCreateProfile } from "@/lib/profile";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2), email: z.string().email(), phone: z.string().optional(), linkedin: z.string().optional(), github: z.string().optional(), location: z.string().optional(), education: z.string().optional(),
  targetRoles: z.array(z.string()), skills: z.array(z.string()), experienceSummary: z.string(), askLumenDescription: z.string(), viksitHubDescription: z.string(), xerxezDescription: z.string(), defaultSignature: z.string(),
  defaultResumeStrategy: z.string().default("category"), dailySendLimit: z.number().int().min(1).max(100), sendDelaySeconds: z.number().int().min(5).max(3600), draftOnlyMode: z.boolean(),
  tavilyApiKey: z.string().optional(), geminiApiKey: z.string().optional(),
});

export async function GET() {
  try {
    const [profile, gmail, tavily, gemini] = await Promise.all([getOrCreateProfile(), db.oAuthCredential.findUnique({ where: { provider: "gmail" } }), db.apiKey.findUnique({ where: { provider: "tavily" } }), db.apiKey.findUnique({ where: { provider: "gemini" } })]);
    return ok({ profile, integrations: { gmail: gmail ? { connected: true, email: gmail.accountEmail } : { connected: false }, tavily: !!tavily || !!process.env.TAVILY_API_KEY, gemini: !!gemini || !!process.env.GEMINI_API_KEY } });
  } catch (error) { return fail(error, 500); }
}

export async function PUT(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const profile = await getOrCreateProfile();
    const { tavilyApiKey, geminiApiKey, ...data } = input;
    const writes: Promise<unknown>[] = [db.userProfile.update({ where: { id: profile.id }, data })];
    if (tavilyApiKey) writes.push(db.apiKey.upsert({ where: { provider: "tavily" }, create: { provider: "tavily", encryptedKey: encryptSecret(tavilyApiKey) }, update: { encryptedKey: encryptSecret(tavilyApiKey) } }));
    if (geminiApiKey) writes.push(db.apiKey.upsert({ where: { provider: "gemini" }, create: { provider: "gemini", encryptedKey: encryptSecret(geminiApiKey) }, update: { encryptedKey: encryptSecret(geminiApiKey) } }));
    await Promise.all(writes);
    await db.activityLog.create({ data: { action: "SETTINGS_UPDATED", entityType: "UserProfile", entityId: profile.id, status: "SUCCESS", message: "Profile and secure settings updated.", userAction: true } });
    return ok({ success: true });
  } catch (error) { return fail(error); }
}
