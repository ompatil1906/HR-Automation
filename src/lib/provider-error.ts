export type ProviderFailure = {
  code: "GEMINI_SPEND_CAP" | "GEMINI_RATE_LIMIT" | "GEMINI_HIGH_DEMAND" | "PROVIDER_ERROR";
  message: string;
  configurationBlocked: boolean;
  retryable: boolean;
};

export function classifyProviderError(error: unknown): ProviderFailure {
  const raw = error instanceof Error ? error.message : String(error || "Automation failed");
  if (/monthly spending cap|ai\.studio\/spend/i.test(raw)) return {
    code: "GEMINI_SPEND_CAP",
    message: "Gemini monthly spending cap exceeded. Increase the project cap in Google AI Studio or replace the Gemini API key in Settings, then retry automation.",
    configurationBlocked: true,
    retryable: false,
  };
  if (/503|service unavailable|high demand|temporar(?:y|ily) unavailable/i.test(raw)) return {
    code: "GEMINI_HIGH_DEMAND",
    message: "Gemini is temporarily experiencing high demand. ColdMailOS retried automatically; retry the pending contacts in a few minutes if capacity remains unavailable.",
    configurationBlocked: false,
    retryable: true,
  };
  if (/429|too many requests|quota exceeded|resource_exhausted/i.test(raw)) return {
    code: "GEMINI_RATE_LIMIT",
    message: "Gemini rate limit is temporarily unavailable. ColdMailOS retried automatically; retry pending contacts after the quota window resets.",
    configurationBlocked: false,
    retryable: true,
  };
  return { code: "PROVIDER_ERROR", message: raw, configurationBlocked: false, retryable: false };
}
