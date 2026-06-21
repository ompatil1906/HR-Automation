import { db } from "@/lib/db";

export const defaultRoles = [
  "AI/ML Engineer", "Generative AI Engineer", "LLM Engineer", "AI Agent Developer",
  "Backend Engineer", "Software Engineer", "Full-Stack Engineer", "Data Scientist Intern",
  "Python Developer Intern", "Product Engineer", "Founding Engineer / Startup Engineer",
];

export const defaultSkills = [
  "Python", "FastAPI", "SQL", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
  "LLMs", "RAG", "LangChain", "LangGraph", "AI Agents", "REST APIs", "Git", "Linux",
  "Docker", "React", "Next.js", "Node.js", "Cloud basics", "DevOps basics",
];

export async function getOrCreateProfile() {
  const existing = await db.userProfile.findFirst();
  if (existing) return existing;
  return db.userProfile.create({ data: {
    name: process.env.DEFAULT_USER_NAME || "Om Patil",
    email: process.env.DEFAULT_USER_EMAIL || "patilom1906@gmail.com",
    phone: process.env.DEFAULT_USER_PHONE || "7436083790",
    linkedin: process.env.DEFAULT_USER_LINKEDIN || "linkedin.com/in/om-patil19",
    github: process.env.DEFAULT_USER_GITHUB || "github.com/ompatil1906",
    location: "Pune, Maharashtra, India",
    education: "B.Tech Artificial Intelligence & Data Science",
    targetRoles: defaultRoles,
    skills: defaultSkills,
    experienceSummary: "Director | Product, Strategy & Technology and Founding AI/ML Engineer at AskLumenAI; Full-Stack Engineer Intern at ViksitHub; internship experience at XerXez Solutions.",
    askLumenDescription: "Product, strategy, technology, and applied AI/ML work at AskLumenAI.",
    viksitHubDescription: "Full-stack engineering internship experience.",
    xerxezDescription: "Software internship experience at XerXez Solutions.",
    defaultSignature: "Best regards,\nOm Patil\nEmail: patilom1906@gmail.com\nPhone: 7436083790\nLinkedIn: linkedin.com/in/om-patil19\nGitHub: github.com/ompatil1906",
  }});
}
