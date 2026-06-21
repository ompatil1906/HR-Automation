export function emailGenerationPrompt(input: { profile: unknown; contact: unknown; research: unknown }) {
  return `Write a concise, professional cold outreach email for Om Patil. Use only claims present in the supplied profile and verified research. Do not invent facts, praise, metrics, achievements, job openings, or familiarity. Avoid spammy/superlative language. Keep the body under 220 words. Return valid JSON only with: subject, body, followUpBody, personalizationLine, targetRole, confidenceScore, manualReviewRequired.

The subject should follow "Application for [Target Role] | Om Patil". The body should address the named HR or Hiring Team, include one restrained company-specific line, relevant verified experience, a polite opportunity request, and the supplied signature. If research confidence is below 60, set manualReviewRequired true.

Profile: ${JSON.stringify(input.profile)}
Contact: ${JSON.stringify(input.contact)}
Verified research: ${JSON.stringify(input.research)}`;
}
