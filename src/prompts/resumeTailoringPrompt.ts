export function resumeTailoringPrompt(input: { latex: string; profile: unknown; research: unknown }) {
  return `Tailor this LaTeX resume conservatively for the verified company research. Preserve the complete LaTeX structure and all factual content. Modify only professional summary/objective, skills ordering, emphasis/order of existing project and experience bullets, and role-targeting keywords. Never add companies, projects, technologies, metrics, experience, achievements, or facts not present in the original. Escape LaTeX special characters. Output valid LaTeX only, with no markdown fence.

Profile: ${JSON.stringify(input.profile)}
Verified research: ${JSON.stringify(input.research)}

Original LaTeX:\n${input.latex}`;
}
