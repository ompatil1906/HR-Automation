import { db } from "@/lib/db";
import { isValidEmail, matchesResumeCompany } from "@/lib/utils";

export async function validateOutreach(contactId: string) {
  const contact = await db.contact.findUniqueOrThrow({ where: { id: contactId }, include: { research: true, generatedEmails: { orderBy: { createdAt: "desc" }, take: 1 }, generatedResumes: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const email = contact.generatedEmails[0];
  const resume = contact.generatedResumes[0];
  const reasons: string[] = [];
  if (!isValidEmail(contact.hrEmail)) reasons.push("HR email is missing or invalid.");
  if (!contact.companyName.trim()) reasons.push("Company name is missing.");
  if (!email) reasons.push("No generated email exists.");
  if (!resume?.pdfFileUrl || resume.compileStatus !== "COMPLETED") reasons.push("Company-specific resume PDF is missing.");
  if (resume && !matchesResumeCompany(resume.fileName, contact.companyName)) reasons.push("Resume filename does not match the company.");
  if (email && !email.body.toLowerCase().includes(contact.companyName.toLowerCase())) reasons.push("Email does not mention the correct company.");
  if (email && email.body.trim().split(/\s+/).length > 220) reasons.push("Email is longer than 220 words.");
  if (email && !email.approved) reasons.push("Email has not been manually approved.");
  if ((contact.research?.manualReviewRequired || email?.manualReviewRequired) && !contact.manualReviewResolved) reasons.push("Manual review is required and unresolved.");
  return { pass: reasons.length === 0, reasons, contact, email, resume };
}
