import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type ResumeData = {
  name: string; email: string; phone?: string | null; linkedin?: string | null; github?: string | null;
  portfolio?: string | null; location?: string | null; education?: string | null; skills: string[]; targetRole: string;
  summary: string; experience: Array<{ title: string; meta?: string; detail: string }>;
  educationEntries?: Array<{ institution: string; degree: string; field: string; location: string; startDate: string; endDate: string; grade: string; highlights: string[] }>;
  projects?: Array<{ name: string; role: string; url: string; description: string; highlights: string[]; technologies: string[] }>;
  certifications?: Array<{ name: string; issuer: string; issuedDate: string; credentialUrl: string }>;
  achievements?: string[];
};

function wrap(text: string, max = 92) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max) { if (line) lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderResumePdf(data: ResumeData) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  let y = height - 48;
  const margin = 46;
  const navy = rgb(0.07, 0.12, 0.2);
  const muted = rgb(0.32, 0.38, 0.47);
  const ensure = (needed: number) => { if (y - needed < 42) { page = pdf.addPage([595.28, 841.89]); y = 800; } };
  const line = (text: string, size = 9.5, isBold = false, color = navy, indent = 0) => {
    ensure(size + 7); page.drawText(text, { x: margin + indent, y, size, font: isBold ? bold : regular, color }); y -= size + 5;
  };
  const paragraph = (text: string, size = 9.2, indent = 0) => { for (const l of wrap(text, indent ? 86 : 92)) line(l, size, false, navy, indent); y -= 2; };
  const heading = (text: string) => { y -= 5; line(text.toUpperCase(), 10.5, true); page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.8, color: rgb(0.2, 0.45, 0.75) }); y -= 5; };

  line(data.name, 22, true);
  line(data.targetRole, 10.5, true, rgb(0.15, 0.4, 0.68));
  paragraph([data.email, data.phone, data.location, data.linkedin, data.github, data.portfolio].filter(Boolean).join("  |  "), 8.3);
  heading("Professional Summary");
  paragraph(data.summary);
  heading("Technical Skills");
  paragraph(data.skills.join(" • "));
  heading("Experience");
  for (const item of data.experience) { line(item.title, 9.7, true); if (item.meta) line(item.meta, 8.2, false, muted); paragraph(item.detail, 9, 8); y += 1; }
  if (data.projects?.length) {
    heading("Projects");
    for (const item of data.projects) {
      line([item.name, item.role].filter(Boolean).join(" — "), 9.7, true);
      paragraph([item.description, ...item.highlights, item.technologies.length ? `Technologies: ${item.technologies.join(", ")}` : ""].filter(Boolean).join(" • "), 9, 8);
    }
  }
  heading("Education");
  if (data.educationEntries?.length) {
    for (const item of data.educationEntries) {
      line([item.degree, item.field].filter(Boolean).join(" — "), 9.7, true);
      paragraph([item.institution, item.location, [item.startDate, item.endDate].filter(Boolean).join(" – "), item.grade, ...item.highlights].filter(Boolean).join(" • "), 9, 8);
    }
  } else paragraph(data.education || "Education not provided");
  if (data.certifications?.length) {
    heading("Certifications");
    for (const item of data.certifications) paragraph([item.name, item.issuer, item.issuedDate].filter(Boolean).join(" — "));
  }
  if (data.achievements?.length) { heading("Achievements"); for (const item of data.achievements) paragraph(`• ${item}`); }
  return Buffer.from(await pdf.save());
}

export async function compileLatexToPdf(latex: string): Promise<Buffer> {
  const formData = new FormData();
  formData.append("filecontents", latex);
  formData.append("filename", "resume.tex");
  formData.append("engine", "pdflatex");
  formData.append("return", "pdf");

  const response = await fetch("https://texlive.net/cgi-bin/latexcgi", {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`LaTeX compilation failed: ${response.status} ${response.statusText}`);
  const pdf = Buffer.from(await response.arrayBuffer());
  if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("LaTeX compiler returned an invalid PDF");
  return pdf;
}
