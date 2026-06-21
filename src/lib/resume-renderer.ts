import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type ResumeData = {
  name: string; email: string; phone?: string | null; linkedin?: string | null; github?: string | null;
  location?: string | null; education?: string | null; skills: string[]; targetRole: string;
  summary: string; experience: Array<{ title: string; detail: string }>;
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
  paragraph([data.email, data.phone, data.location, data.linkedin, data.github].filter(Boolean).join("  |  "), 8.3);
  heading("Professional Summary");
  paragraph(data.summary);
  heading("Technical Skills");
  paragraph(data.skills.join(" • "));
  heading("Experience");
  for (const item of data.experience) { line(item.title, 9.7, true); paragraph(item.detail, 9, 8); y += 1; }
  heading("Education");
  paragraph(data.education || "B.Tech Artificial Intelligence & Data Science");
  return Buffer.from(await pdf.save());
}
