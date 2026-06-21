import { google } from "googleapis";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { fetchFile } from "@/lib/storage";
import { validateOutreach } from "@/lib/quality";
import { getOrCreateProfile } from "@/lib/profile";

export function oauthClient() {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
}

export function gmailAuthUrl(state: string) {
  return oauthClient().generateAuthUrl({ access_type: "offline", prompt: "consent", state, scope: ["https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.labels", "https://www.googleapis.com/auth/userinfo.email"] });
}

export async function saveGmailTokens(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const oauth = google.oauth2({ version: "v2", auth: client });
  const me = await oauth.userinfo.get();
  return db.oAuthCredential.upsert({ where: { provider: "gmail" }, create: { provider: "gmail", encryptedTokens: encryptSecret(JSON.stringify(tokens)), accountEmail: me.data.email }, update: { encryptedTokens: encryptSecret(JSON.stringify(tokens)), accountEmail: me.data.email } });
}

async function gmailClient() {
  const stored = await db.oAuthCredential.findUnique({ where: { provider: "gmail" } });
  if (!stored) throw new Error("Gmail is not connected");
  const client = oauthClient();
  client.setCredentials(JSON.parse(decryptSecret(stored.encryptedTokens)));
  client.on("tokens", async (tokens) => {
    const current = JSON.parse(decryptSecret(stored.encryptedTokens));
    await db.oAuthCredential.update({ where: { id: stored.id }, data: { encryptedTokens: encryptSecret(JSON.stringify({ ...current, ...tokens })) } });
  });
  return google.gmail({ version: "v1", auth: client });
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=`;
}

export function buildGmailRaw(input: { to: string; from: string; subject: string; body: string; attachmentName: string; attachment: Buffer }) {
  const boundary = `coldmailos_${crypto.randomUUID()}`;
  const lines = [
    `From: ${input.from}`, `To: ${input.to}`, `Subject: ${encodeHeader(input.subject)}`, "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`, "", `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "",
    Buffer.from(input.body).toString("base64"), "", `--${boundary}`,
    `Content-Type: application/pdf; name="${input.attachmentName}"`, "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${input.attachmentName}"`, "",
    input.attachment.toString("base64"), "", `--${boundary}--`, "",
  ];
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

async function ensureLabels(gmail: ReturnType<typeof google.gmail>, names: string[]) {
  const response = await gmail.users.labels.list({ userId: "me" });
  const existing = new Map((response.data.labels || []).map((label) => [label.name, label.id]));
  const ids: string[] = [];
  for (const name of names) {
    let id = existing.get(name);
    if (!id) id = (await gmail.users.labels.create({ userId: "me", requestBody: { name, labelListVisibility: "labelShow", messageListVisibility: "show" } })).data.id || undefined;
    if (id) ids.push(id);
  }
  return ids;
}

async function packageFor(contactId: string) {
  const check = await validateOutreach(contactId);
  if (!check.pass || !check.email || !check.resume?.pdfFileUrl) throw new Error(`Quality check failed: ${check.reasons.join(" ")}`);
  const profile = await getOrCreateProfile();
  return { check, profile, attachment: await fetchFile(check.resume.pdfFileUrl) };
}

export async function createGmailDraft(contactId: string) {
  const { check, profile, attachment } = await packageFor(contactId);
  const gmail = await gmailClient();
  const raw = buildGmailRaw({ to: check.contact.hrEmail, from: profile.email, subject: check.email!.subject, body: check.email!.body, attachmentName: check.resume!.fileName, attachment });
  const result = await gmail.users.drafts.create({ userId: "me", requestBody: { message: { raw } } });
  const labelIds = await ensureLabels(gmail, ["Cold Outreach", "Drafted"]);
  if (result.data.message?.id && labelIds.length) await gmail.users.messages.modify({ userId: "me", id: result.data.message.id, requestBody: { addLabelIds: labelIds } });
  const draft = await db.gmailDraft.create({ data: { contactId, generatedEmailId: check.email!.id, gmailDraftId: result.data.id, status: "CREATED" } });
  await db.contact.update({ where: { id: contactId }, data: { status: "DRAFTED" } });
  await db.activityLog.create({ data: { action: "GMAIL_DRAFT_CREATED", entityType: "GmailDraft", entityId: draft.id, contactId, campaignId: check.contact.campaignId, companyName: check.contact.companyName, hrEmail: check.contact.hrEmail, status: "SUCCESS", message: "Individual Gmail draft created with matched resume attachment.", userAction: true } });
  return draft;
}

export async function sendGmailEmail(contactId: string) {
  const profile = await getOrCreateProfile();
  if (profile.draftOnlyMode) throw new Error("Draft-only mode is enabled in Settings");
  const sentToday = await db.sentEmail.count({ where: { status: "SENT", sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } });
  if (sentToday >= profile.dailySendLimit) throw new Error(`Daily send limit (${profile.dailySendLimit}) reached`);
  const { check, attachment } = await packageFor(contactId);
  const gmail = await gmailClient();
  const raw = buildGmailRaw({ to: check.contact.hrEmail, from: profile.email, subject: check.email!.subject, body: check.email!.body, attachmentName: check.resume!.fileName, attachment });
  const result = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  const labelIds = await ensureLabels(gmail, ["Cold Outreach", "Sent"]);
  if (result.data.id && labelIds.length) await gmail.users.messages.modify({ userId: "me", id: result.data.id, requestBody: { addLabelIds: labelIds } });
  const sent = await db.sentEmail.create({ data: { contactId, generatedEmailId: check.email!.id, gmailMessageId: result.data.id, sentAt: new Date(), status: "SENT" } });
  await db.contact.update({ where: { id: contactId }, data: { status: "SENT" } });
  await db.activityLog.create({ data: { action: "EMAIL_SENT", entityType: "SentEmail", entityId: sent.id, contactId, campaignId: check.contact.campaignId, companyName: check.contact.companyName, hrEmail: check.contact.hrEmail, status: "SUCCESS", message: "Approved email sent individually.", userAction: true } });
  return sent;
}
