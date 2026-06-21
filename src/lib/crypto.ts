import crypto from "node:crypto";

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not configured");
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value: string) {
  const [ivRaw, tagRaw, ciphertextRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !ciphertextRaw) throw new Error("Invalid encrypted payload");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
