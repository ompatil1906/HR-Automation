import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

async function apiKey() {
  const stored = await db.apiKey.findUnique({ where: { provider: "gemini" } });
  if (stored) return decryptSecret(stored.encryptedKey);
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  throw new Error("Gemini API key is not configured");
}

export async function generateGeminiJson<T>(prompt: string): Promise<T> {
  const client = new GoogleGenerativeAI(await apiKey());
  const model = client.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { responseMimeType: "application/json", temperature: 0.2 } });
  const response = await model.generateContent(prompt);
  return parseGeminiJson<T>(response.response.text());
}

export async function generateGeminiText(prompt: string) {
  const client = new GoogleGenerativeAI(await apiKey());
  const model = client.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { temperature: 0.2 } });
  const response = await model.generateContent(prompt);
  return response.response.text().replace(/^```(?:latex|tex)?\s*/i, "").replace(/```\s*$/, "").trim();
}

export function parseGeminiJson<T>(value: string): T {
  const stripped = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try { return JSON.parse(stripped) as T; } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(stripped.slice(start, end + 1)) as T;
    throw new Error("Gemini returned invalid JSON");
  }
}
