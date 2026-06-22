import { z } from "zod";

const shortText = z.string().trim().max(200);
const detailText = z.string().trim().max(5000);
const stringList = z.array(z.string().trim().min(1).max(500)).max(50);

export const experienceSchema = z.object({
  id: z.string().min(1).max(100),
  company: shortText.min(1),
  role: shortText.min(1),
  employmentType: shortText.optional().default(""),
  location: shortText.optional().default(""),
  startDate: shortText.optional().default(""),
  endDate: shortText.optional().default(""),
  current: z.boolean().default(false),
  description: detailText.default(""),
  achievements: stringList.default([]),
  technologies: stringList.default([]),
});

export const educationEntrySchema = z.object({
  id: z.string().min(1).max(100),
  institution: shortText.default(""),
  degree: shortText.min(1),
  field: shortText.optional().default(""),
  location: shortText.optional().default(""),
  startDate: shortText.optional().default(""),
  endDate: shortText.optional().default(""),
  grade: shortText.optional().default(""),
  highlights: stringList.default([]),
});

export const projectSchema = z.object({
  id: z.string().min(1).max(100),
  name: shortText.min(1),
  role: shortText.optional().default(""),
  url: z.string().trim().max(500).default(""),
  description: detailText.default(""),
  highlights: stringList.default([]),
  technologies: stringList.default([]),
});

export const certificationSchema = z.object({
  id: z.string().min(1).max(100),
  name: shortText.min(1),
  issuer: shortText.optional().default(""),
  issuedDate: shortText.optional().default(""),
  credentialUrl: z.string().trim().max(500).default(""),
});

export const structuredProfileSchema = {
  headline: shortText.default(""),
  portfolio: z.string().trim().max(500).optional().default(""),
  professionalSummary: detailText.default(""),
  experiences: z.array(experienceSchema).max(30).default([]),
  educationEntries: z.array(educationEntrySchema).max(20).default([]),
  projects: z.array(projectSchema).max(30).default([]),
  certifications: z.array(certificationSchema).max(30).default([]),
  achievements: stringList.default([]),
};

export type Experience = z.infer<typeof experienceSchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type ProfileProject = z.infer<typeof projectSchema>;
export type Certification = z.infer<typeof certificationSchema>;

export function parseStoredArray<T>(value: unknown, schema: z.ZodType<T[]>): T[] {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
