import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { classifyProviderError } from "@/lib/provider-error";

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

async function apiKey() {
  const stored = await db.apiKey.findUnique({ where: { provider: "gemini" } });
  if (stored) return decryptSecret(stored.encryptedKey);
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  throw new Error("Gemini API key is not configured");
}

async function generateWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  const attempts = 4;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try { return await operation(); }
    catch (error) {
      const failure = classifyProviderError(error);
      if (!failure.retryable || attempt === attempts - 1) throw error;
      const delay = 1_000 * 2 ** attempt + Math.floor(Math.random() * 750);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Gemini request failed after retries");
}

export async function generateGeminiJson<T>(prompt: string): Promise<T> {
  const client = new GoogleGenerativeAI(await apiKey());
  const model = client.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { responseMimeType: "application/json", temperature: 0.2 } });
  const response = await generateWithRetry(() => model.generateContent(prompt));
  return parseGeminiJson<T>(response.response.text());
}

export async function generateGeminiText(prompt: string) {
  const client = new GoogleGenerativeAI(await apiKey());
  const model = client.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { temperature: 0.2 } });
  const response = await generateWithRetry(() => model.generateContent(prompt));
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
