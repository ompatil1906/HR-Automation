import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeCompanyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|incorporated|inc|llc|corp|corporation)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sanitizeCompanyForFilename(value: string) {
  const clean = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70);
  return clean || "Company";
}

export function resumeFileName(company: string) {
  return `Om_Patil_Resume_${sanitizeCompanyForFilename(company)}.pdf`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
}

export function matchesResumeCompany(fileName: string, company: string) {
  return fileName === resumeFileName(company);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
