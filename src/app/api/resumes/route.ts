import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { storeFile } from "@/lib/storage";

export async function GET() { try { return ok(await db.resumeTemplate.findMany({ orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] })); } catch (error) { return fail(error, 500); } }

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "Resume Template");
    const type = String(form.get("type") || "BASE");
    const latexFile = form.get("latexFile");
    const pdfFile = form.get("pdfFile");
    const latex = latexFile instanceof File ? await latexFile.text() : String(form.get("latex") || "");
    if (!latex.trim()) throw new Error("LaTeX source is required");
    const pdfUrl = pdfFile instanceof File && pdfFile.size ? await storeFile(`resumes/original/${Date.now()}_${pdfFile.name}`, Buffer.from(await pdfFile.arrayBuffer()), "application/pdf") : undefined;
    const template = await db.$transaction(async (tx) => {
      if (form.get("isDefault") === "true") await tx.resumeTemplate.updateMany({ data: { isDefault: false } });
      return tx.resumeTemplate.create({ data: { name, type, originalLatex: latex, currentLatex: latex, originalPdfUrl: pdfUrl, isDefault: form.get("isDefault") === "true" } });
    });
    return ok(template, 201);
  } catch (error) { return fail(error); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) throw new Error("Template id is required");
    const template = await db.$transaction(async (tx) => {
      if (body.isDefault) await tx.resumeTemplate.updateMany({ data: { isDefault: false } });
      return tx.resumeTemplate.update({ where: { id: body.id }, data: { name: body.name, type: body.type, currentLatex: body.currentLatex, isDefault: body.isDefault } });
    });
    return ok(template);
  } catch (error) { return fail(error); }
}
