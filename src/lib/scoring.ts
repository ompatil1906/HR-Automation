const categoryScores: Record<string, number> = {
  "Generative AI Startup": 95, "AI/ML Company": 90, "Research / DeepTech": 88,
  "Data Analytics Company": 85, "Product SaaS Company": 82, "Cloud / DevOps": 80,
  "Enterprise Software Company": 75, "Enterprise Software": 75, "IT Services / MNC": 70,
  "Consulting Company": 65, "Staffing / Recruitment": 45, "Unknown / Needs Manual Review": 40,
};

export type ScoreInput = {
  category: string; hasEmail: boolean; emailValid: boolean; softwareRelevant: boolean;
  hiringSignals: boolean; hasWebPresence: boolean; isStartupOrProduct: boolean;
  manualReviewRequired: boolean; confidenceScore: number;
};

export function priorityScore(input: ScoreInput) {
  let score = categoryScores[input.category] ?? 55;
  if (input.hasEmail) score += 5;
  if (input.softwareRelevant) score += 5;
  if (input.hiringSignals) score += 5;
  if (input.hasWebPresence) score += 3;
  if (input.isStartupOrProduct) score += 3;
  if (input.manualReviewRequired) score -= 10;
  if (input.confidenceScore < 60) score -= 10;
  if (input.category === "Staffing / Recruitment") score -= 10;
  if (!input.emailValid) score -= 15;
  return Math.max(0, Math.min(100, score));
}

export function hiringLikelihood(score: number) {
  if (score >= 85) return "Very High";
  if (score >= 70) return "High";
  if (score >= 55) return "Medium";
  if (score >= 40) return "Low";
  return "Very Low";
}
