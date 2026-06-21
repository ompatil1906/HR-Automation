export function qualityCheckPrompt(input: unknown) {
  return `Audit this outreach package. Check recipient and company consistency, resume filename/company match, unsupported or hallucinated claims, tone, and whether body exceeds 220 words. Return JSON only: {"pass":boolean,"reasons":string[],"riskScore":number}. Any unsupported company claim, attachment mismatch, or ambiguous company identity must fail. Input: ${JSON.stringify(input)}`;
}
