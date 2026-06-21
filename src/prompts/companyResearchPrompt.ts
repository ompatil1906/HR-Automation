import type { TavilyResult } from "@/lib/tavily";

export function companyResearchPrompt(company: string, results: TavilyResult[]) {
  return `You are a careful company research analyst. Analyze ${JSON.stringify(company)} using ONLY the Tavily evidence below. Never infer a fact that is not supported. If sources conflict or identity is ambiguous, lower confidence and require manual review. Return one valid JSON object only.

Allowed categories: Generative AI Startup, AI/ML Company, Data Analytics Company, Product SaaS Company, Enterprise Software Company, IT Services / MNC, Consulting Company, FinTech, EdTech, HealthTech, E-commerce, Cybersecurity, Cloud / DevOps, Research / DeepTech, Staffing / Recruitment, Unknown / Needs Manual Review.

Schema: {"company_name":"","official_website":"","linkedin_url":"","industry":"","company_type":"","category":"","products_services":"","tech_focus":"","company_background":"","why_relevant_to_om":"","possible_roles":[],"recommended_resume_angle":"","personalization_points":[],"confidence_score":0,"manual_review_required":true,"sources":[],"hiring_signals":[]}

Rules: confidence is 0-100; confidence below 60 always means manual_review_required=true; sources must be URLs present in the evidence; personalization points must be conservative, specific, and source-supported.

Evidence:\n${results.map((r, index) => `[${index + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`).join("\n\n")}`;
}
