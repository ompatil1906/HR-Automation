export type ProviderFailure = {
  code: "GEMINI_SPEND_CAP" | "GEMINI_RATE_LIMIT" | "PROVIDER_ERROR";
  message: string;
  configurationBlocked: boolean;
};

export function classifyProviderError(error: unknown): ProviderFailure {
  const raw = error instanceof Error ? error.message : String(error || "Automation failed");
  if (/monthly spending cap|ai\.studio\/spend/i.test(raw)) return {
    code: "GEMINI_SPEND_CAP",
    message: "Gemini monthly spending cap exceeded. Increase the project cap in Google AI Studio or replace the Gemini API key in Settings, then retry automation.",
    configurationBlocked: true,
  };
  if (/429|too many requests|quota exceeded|resource_exhausted/i.test(raw)) return {
    code: "GEMINI_RATE_LIMIT",
    message: "Gemini quota is temporarily unavailable. Wait for quota reset or replace the Gemini API key, then retry automation.",
    configurationBlocked: true,
  };
  return { code: "PROVIDER_ERROR", message: raw, configurationBlocked: false };
}
