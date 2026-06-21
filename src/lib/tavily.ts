import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

export type TavilyResult = { title: string; url: string; content: string; score?: number };

export function dedupeTavilyResults(batches: TavilyResult[][], limit = 16) {
  const unique = new Map<string, TavilyResult>();
  for (const item of batches.flat()) if (item.url && !unique.has(item.url)) unique.set(item.url, item);
  return [...unique.values()].slice(0, limit);
}

async function apiKey() {
  const stored = await db.apiKey.findUnique({ where: { provider: "tavily" } });
  if (stored) return decryptSecret(stored.encryptedKey);
  if (process.env.TAVILY_API_KEY) return process.env.TAVILY_API_KEY;
  throw new Error("Tavily API key is not configured");
}

export async function researchWithTavily(company: string) {
  const queries = [
    `${company} official website company overview`, `${company} careers software engineer AI ML`,
    `${company} LinkedIn company`, `${company} products services technology`,
  ];
  const key = await apiKey();
  const batches = await Promise.all(queries.map(async (query) => {
    const response = await fetch("https://api.tavily.com/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: key, query, search_depth: "advanced", max_results: 5, include_answer: false }) });
    if (!response.ok) throw new Error(`Tavily request failed (${response.status})`);
    const data = await response.json() as { results?: TavilyResult[] };
    return data.results ?? [];
  }));
  return dedupeTavilyResults(batches);
}
