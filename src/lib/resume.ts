import { db } from "@/lib/db";
import { getOrCreateProfile } from "@/lib/profile";
import { generateGeminiText } from "@/lib/gemini";
import { resumeTailoringPrompt } from "@/prompts/resumeTailoringPrompt";
import { compileLatexToPdf } from "@/lib/resume-renderer";
import { resumeFileName, sanitizeCompanyForFilename } from "@/lib/utils";
import { storeFile } from "@/lib/storage";
import { certificationSchema, educationEntrySchema, experienceSchema, projectSchema } from "@/lib/profile-schema";
import { assertPdfBuffer } from "@/lib/pdf";

const baseLatex = String.raw`\documentclass[10pt,a4paper]{article}
\usepackage[margin=0.65in]{geometry}\usepackage{enumitem}\usepackage[hidelinks]{hyperref}
\begin{document}\begin{center}{\LARGE \textbf{Om Patil}}\\
AI/ML \& Full-Stack Engineer\\patilom1906@gmail.com $|$ 7436083790 $|$ linkedin.com/in/om-patil19 $|$ github.com/ompatil1906\end{center}
\section*{Summary}Artificial Intelligence and Data Science student with hands-on experience in AI/ML, backend development, full-stack engineering, and AI automation systems.
\section*{Skills}Python, FastAPI, SQL, Machine Learning, Deep Learning, NLP, Computer Vision, LLMs, RAG, LangChain, LangGraph, AI Agents, REST APIs, Git, Linux, Docker, React, Next.js, Node.js.
\section*{Experience}\textbf{Director $|$ Product, Strategy \& Technology and Founding AI/ML Engineer, AskLumenAI}\\Applied product, strategy, technology, and AI/ML engineering work.\\
\textbf{Full-Stack Engineer Intern, ViksitHub}\\Full-stack engineering internship experience.\\
\textbf{Intern, XerXez Solutions}\\Software internship experience.
\section*{Education}B.Tech Artificial Intelligence \& Data Science
\end{document}`;

export async function generateResume(contactId: string) {
  const contact = await db.contact.findUniqueOrThrow({ where: { id: contactId }, include: { research: true } });
  if (!contact.research) throw new Error("Research the company before generating a resume");
  const profile = await getOrCreateProfile();
  let template = await db.resumeTemplate.findFirst({ where: { isDefault: true }, orderBy: { updatedAt: "desc" } });
  if (!template) template = await db.resumeTemplate.create({ data: { name: "Original Om Patil Resume", type: "BASE", originalLatex: baseLatex, currentLatex: baseLatex, isDefault: true } });
  const fileName = resumeFileName(contact.companyName);
  const resume = await db.generatedResume.create({ data: { contactId, templateId: template.id, companyName: contact.companyName, resumeType: contact.research.category, latexContent: template.currentLatex, fileName, compileStatus: "PROCESSING" } });
  try {
    const latex = await generateGeminiText(resumeTailoringPrompt({ latex: template.currentLatex, profile, research: contact.research }));
    const roles = contact.research.possibleRoles as string[];
    const role = roles[0] || "AI/ML & Software Engineer";
    const skills = profile.skills as string[];
    const experiences = experienceSchema.array().safeParse(profile.experiences);
    const educationEntries = educationEntrySchema.array().safeParse(profile.educationEntries);
    const projects = projectSchema.array().safeParse(profile.projects);
    const certifications = certificationSchema.array().safeParse(profile.certifications);
    const achievements = Array.isArray(profile.achievements) ? profile.achievements.filter((item): item is string => typeof item === "string") : [];
    const prioritized = [...skills].sort((a, b) => contact.research!.recommendedResumeAngle.toLowerCase().includes(b.toLowerCase()) ? 1 : contact.research!.recommendedResumeAngle.toLowerCase().includes(a.toLowerCase()) ? -1 : 0);
    const fallbackExperience = [
      { title: "Director | Product, Strategy & Technology and Founding AI/ML Engineer — AskLumenAI", detail: profile.askLumenDescription },
      { title: "Full-Stack Engineer Intern — ViksitHub", detail: profile.viksitHubDescription },
      { title: "Intern — XerXez Solutions", detail: profile.xerxezDescription },
    ];
    const generatedPdf = await renderResumePdf({
      name: profile.name, email: profile.email, phone: profile.phone, linkedin: profile.linkedin, github: profile.github,
      portfolio: profile.portfolio, location: profile.location, education: profile.education, targetRole: role, skills: prioritized,
      summary: profile.professionalSummary || profile.experienceSummary,
      experience: experiences.success && experiences.data.length ? experiences.data.map(item => ({
        title: `${item.role} — ${item.company}`,
        meta: [item.employmentType, item.location, [item.startDate, item.current ? "Present" : item.endDate].filter(Boolean).join(" – ")].filter(Boolean).join(" | "),
        detail: [item.description, ...item.achievements, item.technologies.length ? `Technologies: ${item.technologies.join(", ")}` : ""].filter(Boolean).join(" • "),
      })) : fallbackExperience,
      educationEntries: educationEntries.success ? educationEntries.data : [],
      projects: projects.success ? projects.data : [],
      certifications: certifications.success ? certifications.data : [],
      achievements,
    });
    assertPdfBuffer(pdf);
    const pdf = await compileLatexToPdf(latex);
    const key = sanitizeCompanyForFilename(contact.companyName);
    const [pdfUrl, texUrl] = await Promise.all([
      storeFile(`resumes/pdf/${fileName}`, generatedPdf, "application/pdf"),
      storeFile(`resumes/tex/Om_Patil_Resume_${key}.tex`, Buffer.from(latex), "application/x-tex"),
    ]);
    const updated = await db.generatedResume.update({ where: { id: resume.id }, data: { latexContent: latex, pdfFileUrl: pdfUrl, texFileUrl: texUrl, compileStatus: "COMPLETED" } });
    await db.contact.update({ where: { id: contactId }, data: { status: "GENERATED" } });
    await db.activityLog.create({ data: { action: "RESUME_GENERATED", entityType: "GeneratedResume", entityId: resume.id, contactId, campaignId: contact.campaignId, companyName: contact.companyName, hrEmail: contact.hrEmail, status: "SUCCESS", message: fileName } });
    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume generation failed";
    await db.generatedResume.update({ where: { id: resume.id }, data: { compileStatus: "FAILED", errorMessage: message } });
    throw error;
  }
}
