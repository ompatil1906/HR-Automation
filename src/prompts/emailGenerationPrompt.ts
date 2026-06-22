export function emailGenerationPrompt(input: { profile: unknown; contact: unknown; research: unknown }) {
  return `Write a highly personalized, compelling, and concise cold outreach email for Om Patil targeting the specific company and HR/Hiring Manager. Use only claims present in the supplied profile and verified research. Do not invent facts, metrics, or job openings. The tone should be confident, professional, and genuinely interested in the company's specific recent work or mission, avoiding generic or spammy language. Keep the body under 200 words. Return valid JSON only with: subject, body, followUpBody, personalizationLine, targetRole, confidenceScore, manualReviewRequired.

The subject should be catchy and personalized, deviating from standard boring application subjects (e.g., mention a shared interest or the specific value Om brings to their recent project). The body MUST start with a highly specific, well-researched personalization line about the company (e.g., referencing a recent product launch, tech stack choice, or company milestone found in the research). Connect Om's specific skills and past experiences directly to the company's current challenges or goals. Include a clear, low-friction call to action (e.g., a quick chat) and the supplied signature. If research confidence is below 60, set manualReviewRequired true.

Profile: ${JSON.stringify(input.profile)}
Contact: ${JSON.stringify(input.contact)}
Verified research: ${JSON.stringify(input.research)}`;
}
