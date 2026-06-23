"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award, BriefcaseBusiness, CheckCircle2, FileCode2, FilePlus2, FolderGit2,
  GraduationCap, KeyRound, Mail, Plus, Save, ShieldAlert, Trash2, UserRound,
} from "lucide-react";
import { Button, Card, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { fetchJson } from "@/lib/client-api";
import type { Certification, EducationEntry, Experience, ProfileProject } from "@/lib/profile-schema";

type ProfileForm = Record<string, any> & {
  experiences: Experience[];
  educationEntries: EducationEntry[];
  projects: ProfileProject[];
  certifications: Certification[];
  achievements: string[];
};
type ResumeTemplate = { id: string; name: string; type: string; currentLatex: string; isDefault: boolean; updatedAt: string };
type Notice = { tone: "success" | "error" | "info"; text: string };

const resumeTypes = ["BASE", "AI_ML", "GENAI", "BACKEND", "FULL_STACK", "MNC", "RESEARCH"];
const id = () => crypto.randomUUID();
const lines = (value: string) => value.split("\n").map(item => item.trim()).filter(Boolean);
const csv = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean);

const blankExperience = (): Experience => ({ id: id(), company: "", role: "", employmentType: "", location: "", startDate: "", endDate: "", current: false, description: "", achievements: [], technologies: [] });
const blankEducation = (): EducationEntry => ({ id: id(), institution: "", degree: "", field: "", location: "", startDate: "", endDate: "", grade: "", highlights: [] });
const blankProject = (): ProfileProject => ({ id: id(), name: "", role: "", url: "", description: "", highlights: [], technologies: [] });
const blankCertification = (): Certification => ({ id: id(), name: "", issuer: "", issuedDate: "", credentialUrl: "" });

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value?: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <div><label className="label">{label}</label><input className="input" type={type} value={value || ""} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></div>;
}

function SectionTitle({ icon: Icon, title, description, action }: { icon: typeof UserRound; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-700"><Icon size={18} /></span><div><h3 className="font-semibold">{title}</h3><p className="mt-0.5 text-xs text-gray-500">{description}</p></div></div>
    {action}
  </div>;
}

export default function SettingsPage() {
  const [form, setForm] = useState<ProfileForm>();
  const [integrations, setIntegrations] = useState<any>();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [selected, setSelected] = useState<ResumeTemplate>();
  const [saving, setSaving] = useState(false);
  const [cleaningCampaigns, setCleaningCampaigns] = useState(false);
  const [cleanupText, setCleanupText] = useState("");
  const [notice, setNotice] = useState<Notice>();
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [settings, resumes] = await Promise.all([fetchJson<any>("/api/settings"), fetchJson<ResumeTemplate[]>("/api/resumes")]);
      const profile = settings.profile || {};
      setForm({
        ...profile,
        targetRoles: Array.isArray(profile.targetRoles) ? profile.targetRoles.join(", ") : "",
        skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
        experiences: Array.isArray(profile.experiences) ? profile.experiences : [],
        educationEntries: Array.isArray(profile.educationEntries) ? profile.educationEntries : [],
        projects: Array.isArray(profile.projects) ? profile.projects : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
        tavilyApiKey: "",
        geminiApiKey: "",
      });
      setIntegrations(settings.integrations);
      const safeResumes = Array.isArray(resumes) ? resumes : [];
      setTemplates(safeResumes);
      setSelected(current => {
        if (current) return safeResumes.find(item => item.id === current.id) || current;
        const template = safeResumes.find(item => item.isDefault) || safeResumes[0];
        return template ? { ...template } : undefined;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load settings");
    }
  }, []);

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") setNotice({ tone: "success", text: "Gmail connected successfully." });
    if (params.get("gmail") === "error") setNotice({ tone: "error", text: params.get("reason") || "Gmail connection failed. Check the callback URL shown below." });
  }, [load]);

  if (error) return <ErrorState message={error} />;
  if (!form) return <div className="grid h-80 place-items-center"><Spinner /></div>;

  const set = (key: string, value: any) => setForm(previous => previous ? ({ ...previous, [key]: value }) : previous);
  const updateItem = (key: "experiences" | "educationEntries" | "projects" | "certifications", index: number, value: Record<string, unknown>) => {
    setForm(previous => {
      if (!previous) return previous;
      const items = [...previous[key]] as Array<Record<string, unknown>>;
      items[index] = { ...items[index], ...value };
      return { ...previous, [key]: items } as ProfileForm;
    });
  };
  const removeItem = (key: "experiences" | "educationEntries" | "projects" | "certifications", index: number) => set(key, form[key].filter((_: unknown, itemIndex: number) => itemIndex !== index));

  async function saveProfile() {
    if (!form) throw new Error("Profile is not loaded");
    const current = form;
    await fetchJson("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...current,
        targetRoles: csv(current.targetRoles),
        skills: csv(current.skills),
        dailySendLimit: Number(current.dailySendLimit),
        sendDelaySeconds: Number(current.sendDelaySeconds),
      }),
    });
  }

  async function saveResume() {
    if (!selected) return;
    await fetchJson("/api/resumes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selected) });
  }

  async function saveAll() {
    setSaving(true); setNotice(undefined);
    try {
      await saveProfile(); await saveResume();
      setNotice({ tone: "success", text: selected ? "Profile and LaTeX working copy saved." : "Profile saved." });
      await load();
    } catch (cause) {
      setNotice({ tone: "error", text: cause instanceof Error ? cause.message : "Save failed" });
    } finally { setSaving(false); }
  }

  async function uploadResume(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    setSaving(true); setNotice(undefined);
    const data = new FormData(element);
    data.set("isDefault", String(data.get("isDefault") === "on"));
    try {
      await fetchJson("/api/resumes", { method: "POST", body: data });
      setNotice({ tone: "success", text: "New immutable LaTeX resume source saved." });
      element.reset(); await load();
    } catch (cause) {
      setNotice({ tone: "error", text: cause instanceof Error ? cause.message : "Resume upload failed" });
    } finally { setSaving(false); }
  }

  async function clearCampaignData() {
    if (cleanupText !== "DELETE CAMPAIGNS") {
      setNotice({ tone: "error", text: "Type DELETE CAMPAIGNS exactly before clearing campaign data." });
      return;
    }
    const confirmed = window.confirm("This will permanently delete all campaigns, contacts, research, generated resumes/emails, Gmail draft records, sent-email records, automation jobs, and activity logs from the database. Profile, API keys, Gmail connection, and resume templates will stay. Continue?");
    if (!confirmed) return;

    setCleaningCampaigns(true); setNotice(undefined);
    try {
      const result = await fetchJson<any>("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "campaigns" }),
      });
      setCleanupText("");
      setNotice({ tone: "success", text: `Campaign data cleared: ${result.deleted?.campaigns || 0} campaigns, ${result.deleted?.contacts || 0} contacts, ${result.deleted?.generatedResumes || 0} resumes, ${result.deleted?.generatedEmails || 0} emails, and ${result.deleted?.backgroundJobs || 0} automation jobs deleted.` });
      await load();
    } catch (cause) {
      setNotice({ tone: "error", text: cause instanceof Error ? cause.message : "Campaign cleanup failed" });
    } finally {
      setCleaningCampaigns(false);
    }
  }

  const gmailReady = integrations?.gmail?.clientReady && integrations?.gmail?.callbackReady;

  return <>
    <PageHeader title="Profile & resume setup" description="Complete this once. ColdMailOS uses only these verified facts when generating resumes and outreach." action={<Button onClick={saveAll} disabled={saving}>{saving ? <Spinner /> : <Save size={16} />} Save profile</Button>} />
    {notice && <div className={`mb-6 rounded-xl p-4 text-sm ${notice.tone === "success" ? "bg-green-50 text-green-700" : notice.tone === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{notice.text}</div>}

    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b p-6"><h2 className="text-lg font-bold">Resume-ready user profile</h2><p className="mt-1 text-sm text-gray-500">Structured facts replace fixed company fields, so you can add any experience, education, project, or credential.</p></div>

        <section className="p-6">
          <SectionTitle icon={UserRound} title="Personal and contact information" description="Identity and public links shown on generated resumes." />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Full name" value={form.name} onChange={value => set("name", value)} />
            <Field label="Email" type="email" value={form.email} onChange={value => set("email", value)} />
            <Field label="Phone" value={form.phone} onChange={value => set("phone", value)} />
            <Field label="Location" value={form.location} onChange={value => set("location", value)} />
            <Field label="LinkedIn" value={form.linkedin} onChange={value => set("linkedin", value)} />
            <Field label="GitHub" value={form.github} onChange={value => set("github", value)} />
            <Field label="Portfolio / website" value={form.portfolio} onChange={value => set("portfolio", value)} />
            <Field label="Professional headline" value={form.headline} onChange={value => set("headline", value)} placeholder="AI/ML & Full-Stack Engineer" />
          </div>
          <div className="mt-4"><label className="label">Professional summary</label><textarea className="input min-h-28" value={form.professionalSummary || ""} onChange={event => set("professionalSummary", event.target.value)} placeholder="A factual summary used as the source for resume tailoring." /></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div><label className="label">Target roles (comma-separated)</label><textarea className="input min-h-24" value={form.targetRoles} onChange={event => set("targetRoles", event.target.value)} /></div>
            <div><label className="label">Skills (comma-separated)</label><textarea className="input min-h-24" value={form.skills} onChange={event => set("skills", event.target.value)} /></div>
          </div>
        </section>

        <section className="border-t p-6">
          <SectionTitle icon={BriefcaseBusiness} title="Experience" description="Add roles dynamically. Only facts entered here may appear in a generated resume." action={<Button type="button" variant="secondary" onClick={() => set("experiences", [...form.experiences, blankExperience()])}><Plus size={15} /> Add experience</Button>} />
          <div className="mt-5 space-y-4">{form.experiences.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No experience added yet.</p>}{form.experiences.map((item, index) => <div key={item.id} className="rounded-xl border bg-gray-50/60 p-5">
            <div className="mb-4 flex items-center justify-between"><strong className="text-sm">{item.role || "New role"}{item.company ? ` at ${item.company}` : ""}</strong><button type="button" className="text-gray-400 hover:text-red-600" aria-label={`Remove experience ${index + 1}`} onClick={() => removeItem("experiences", index)}><Trash2 size={17} /></button></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Job title / role" value={item.role} onChange={value => updateItem("experiences", index, { role: value })} />
              <Field label="Company" value={item.company} onChange={value => updateItem("experiences", index, { company: value })} />
              <Field label="Employment type" value={item.employmentType} onChange={value => updateItem("experiences", index, { employmentType: value })} placeholder="Full-time, Internship, Contract" />
              <Field label="Location" value={item.location} onChange={value => updateItem("experiences", index, { location: value })} />
              <Field label="Start date" value={item.startDate} onChange={value => updateItem("experiences", index, { startDate: value })} placeholder="Jan 2025" />
              <Field label="End date" value={item.endDate} onChange={value => updateItem("experiences", index, { endDate: value })} placeholder={item.current ? "Present" : "Dec 2025"} />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={item.current} onChange={event => updateItem("experiences", index, { current: event.target.checked, endDate: event.target.checked ? "" : item.endDate })} /> I currently work here</label>
            <div className="mt-4"><label className="label">Role description</label><textarea className="input min-h-24" value={item.description} onChange={event => updateItem("experiences", index, { description: event.target.value })} /></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2"><div><label className="label">Achievements (one per line)</label><textarea className="input min-h-24" value={item.achievements.join("\n")} onChange={event => updateItem("experiences", index, { achievements: lines(event.target.value) })} /></div><div><label className="label">Technologies (comma-separated)</label><textarea className="input min-h-24" value={item.technologies.join(", ")} onChange={event => updateItem("experiences", index, { technologies: csv(event.target.value) })} /></div></div>
          </div>)}</div>
        </section>

        <section className="border-t p-6">
          <SectionTitle icon={GraduationCap} title="Education" description="Degrees, institutions, dates, grades, and factual highlights." action={<Button type="button" variant="secondary" onClick={() => set("educationEntries", [...form.educationEntries, blankEducation()])}><Plus size={15} /> Add education</Button>} />
          <div className="mt-5 space-y-4">{form.educationEntries.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No education added yet.</p>}{form.educationEntries.map((item, index) => <div key={item.id} className="rounded-xl border bg-gray-50/60 p-5">
            <div className="mb-4 flex items-center justify-between"><strong className="text-sm">{item.degree || "New education"}</strong><button type="button" className="text-gray-400 hover:text-red-600" aria-label={`Remove education ${index + 1}`} onClick={() => removeItem("educationEntries", index)}><Trash2 size={17} /></button></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Degree" value={item.degree} onChange={value => updateItem("educationEntries", index, { degree: value })} />
              <Field label="Field of study" value={item.field} onChange={value => updateItem("educationEntries", index, { field: value })} />
              <Field label="Institution" value={item.institution} onChange={value => updateItem("educationEntries", index, { institution: value })} />
              <Field label="Location" value={item.location} onChange={value => updateItem("educationEntries", index, { location: value })} />
              <Field label="Start date" value={item.startDate} onChange={value => updateItem("educationEntries", index, { startDate: value })} />
              <Field label="End date" value={item.endDate} onChange={value => updateItem("educationEntries", index, { endDate: value })} />
              <Field label="Grade / CGPA" value={item.grade} onChange={value => updateItem("educationEntries", index, { grade: value })} />
            </div>
            <div className="mt-4"><label className="label">Highlights (one per line)</label><textarea className="input min-h-20" value={item.highlights.join("\n")} onChange={event => updateItem("educationEntries", index, { highlights: lines(event.target.value) })} /></div>
          </div>)}</div>
        </section>

        <section className="border-t p-6">
          <SectionTitle icon={FolderGit2} title="Projects" description="Projects and technical work that can be emphasized for relevant companies." action={<Button type="button" variant="secondary" onClick={() => set("projects", [...form.projects, blankProject()])}><Plus size={15} /> Add project</Button>} />
          <div className="mt-5 space-y-4">{form.projects.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No projects added yet.</p>}{form.projects.map((item, index) => <div key={item.id} className="rounded-xl border bg-gray-50/60 p-5">
            <div className="mb-4 flex items-center justify-between"><strong className="text-sm">{item.name || "New project"}</strong><button type="button" className="text-gray-400 hover:text-red-600" aria-label={`Remove project ${index + 1}`} onClick={() => removeItem("projects", index)}><Trash2 size={17} /></button></div>
            <div className="grid gap-4 md:grid-cols-3"><Field label="Project name" value={item.name} onChange={value => updateItem("projects", index, { name: value })} /><Field label="Your role" value={item.role} onChange={value => updateItem("projects", index, { role: value })} /><Field label="Project URL" value={item.url} onChange={value => updateItem("projects", index, { url: value })} /></div>
            <div className="mt-4"><label className="label">Description</label><textarea className="input min-h-24" value={item.description} onChange={event => updateItem("projects", index, { description: event.target.value })} /></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2"><div><label className="label">Highlights (one per line)</label><textarea className="input min-h-20" value={item.highlights.join("\n")} onChange={event => updateItem("projects", index, { highlights: lines(event.target.value) })} /></div><div><label className="label">Technologies (comma-separated)</label><textarea className="input min-h-20" value={item.technologies.join(", ")} onChange={event => updateItem("projects", index, { technologies: csv(event.target.value) })} /></div></div>
          </div>)}</div>
        </section>

        <section className="border-t p-6">
          <SectionTitle icon={Award} title="Certifications and achievements" description="Optional credentials and factual accomplishments." action={<Button type="button" variant="secondary" onClick={() => set("certifications", [...form.certifications, blankCertification()])}><Plus size={15} /> Add certification</Button>} />
          <div className="mt-5 space-y-4">{form.certifications.map((item, index) => <div key={item.id} className="grid gap-4 rounded-xl border bg-gray-50/60 p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_1fr_auto] xl:items-end"><Field label="Certification" value={item.name} onChange={value => updateItem("certifications", index, { name: value })} /><Field label="Issuer" value={item.issuer} onChange={value => updateItem("certifications", index, { issuer: value })} /><Field label="Issued date" value={item.issuedDate} onChange={value => updateItem("certifications", index, { issuedDate: value })} /><Field label="Credential URL" value={item.credentialUrl} onChange={value => updateItem("certifications", index, { credentialUrl: value })} /><button type="button" className="mb-3 text-gray-400 hover:text-red-600" aria-label={`Remove certification ${index + 1}`} onClick={() => removeItem("certifications", index)}><Trash2 size={17} /></button></div>)}</div>
          <div className="mt-4"><label className="label">Other achievements (one per line)</label><textarea className="input min-h-24" value={form.achievements.join("\n")} onChange={event => set("achievements", lines(event.target.value))} /></div>
        </section>

        <section className="border-t p-6">
          <SectionTitle icon={Mail} title="Outreach delivery and integrations" description="Gmail connection, private AI credentials, and server-enforced send limits." />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Daily send limit" type="number" value={String(form.dailySendLimit)} onChange={value => set("dailySendLimit", value)} />
            <Field label="Delay between sends (seconds)" type="number" value={String(form.sendDelaySeconds)} onChange={value => set("sendDelaySeconds", value)} />
            <div><label className="label">Resume strategy</label><select className="input" value={form.defaultResumeStrategy} onChange={event => set("defaultResumeStrategy", event.target.value)}><option value="category">By company category</option><option value="role">By target role</option></select></div>
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><input type="checkbox" checked={Boolean(form.draftOnlyMode)} onChange={event => set("draftOnlyMode", event.target.checked)} /><span><strong className="block text-sm text-amber-900">Draft-only mode</strong><small className="text-amber-700">Recommended. Sending remains blocked until you explicitly disable this.</small></span></label>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border p-5">
              <div className="flex items-center gap-2 font-semibold"><Mail size={17} /> Gmail</div>
              <div className="mt-3 flex items-center gap-2 text-sm">{integrations?.gmail?.connected ? <><CheckCircle2 size={17} className="text-green-600" /><span>Connected as {integrations.gmail.email}</span></> : <><ShieldAlert size={17} className="text-amber-600" /><span>Not connected</span></>}</div>
              {!gmailReady && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">Google OAuth client or callback URL is incomplete. Configure the Vercel variables and register the exact callback URL in Google Cloud.</p>}
              {integrations?.gmail?.redirectUri && <div className="mt-3"><label className="label">Authorized callback URL</label><input className="input font-mono text-xs" readOnly value={integrations.gmail.redirectUri} /></div>}
              {gmailReady ? <a className="btn btn-secondary mt-4" href="/api/gmail/oauth/start">{integrations?.gmail?.connected ? "Reconnect Gmail" : "Connect Gmail"}</a> : <button className="btn btn-secondary mt-4" disabled>Connect Gmail</button>}
            </div>
            <div className="rounded-xl border p-5">
              <div className="flex items-center gap-2 font-semibold"><KeyRound size={17} /> AI integrations</div>
              <p className="mt-2 text-xs leading-5 text-gray-500">Keys are encrypted server-side and never returned to the browser.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label={`Tavily key ${integrations?.tavily ? "✓" : ""}`} type="password" value={form.tavilyApiKey} placeholder={integrations?.tavily ? "Saved — enter to replace" : "tvly-..."} onChange={value => set("tavilyApiKey", value)} /><Field label={`Gemini key ${integrations?.gemini ? "✓" : ""}`} type="password" value={form.geminiApiKey} placeholder={integrations?.gemini ? "Saved — enter to replace" : "AIza..."} onChange={value => set("geminiApiKey", value)} /></div>
            </div>
          </div>
          <div className="mt-4"><label className="label">Default email signature</label><textarea className="input min-h-28" value={form.defaultSignature || ""} onChange={event => set("defaultSignature", event.target.value)} /></div>
        </section>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-6"><div><h2 className="flex items-center gap-2 text-lg font-bold"><FileCode2 size={20} /> LaTeX resume source</h2><p className="mt-1 text-sm text-gray-500">The uploaded original stays immutable; edits apply only to its working copy.</p></div>{templates.length > 0 && <select className="input min-w-64" value={selected?.id || ""} onChange={event => { const template = templates.find(item => item.id === event.target.value); setSelected(template ? { ...template } : undefined); }}>{templates.map(template => <option key={template.id} value={template.id}>{template.name}{template.isDefault ? " — Default" : ""}</option>)}</select>}</div>
        {selected ? <div className="p-6"><div className="grid gap-4 md:grid-cols-[1fr_220px]"><Field label="Template name" value={selected.name} onChange={value => setSelected({ ...selected, name: value })} /><div><label className="label">Resume type</label><select className="input" value={selected.type} onChange={event => setSelected({ ...selected, type: event.target.value })}>{resumeTypes.map(type => <option key={type}>{type}</option>)}</select></div></div><div className="mt-4"><label className="label">LaTeX source code</label><textarea spellCheck={false} className="input min-h-[620px] resize-y bg-[#101828] font-mono text-xs leading-5 text-gray-100" value={selected.currentLatex} onChange={event => setSelected({ ...selected, currentLatex: event.target.value })} /></div><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.isDefault} onChange={event => setSelected({ ...selected, isDefault: event.target.checked })} /> Use as default base resume</label></div> : <div className="p-6 text-sm text-gray-500">No LaTeX resume has been added yet. Upload the base source below.</div>}
        <form onSubmit={uploadResume} className="grid gap-4 border-t bg-gray-50 p-6 md:grid-cols-2 xl:grid-cols-[1fr_180px_1fr_1fr_auto] xl:items-end"><div><label className="label">New template name</label><input name="name" className="input" required placeholder="Om — Master Resume" /></div><div><label className="label">Type</label><select name="type" className="input">{resumeTypes.map(type => <option key={type}>{type}</option>)}</select></div><div><label className="label">LaTeX file (.tex)</label><input name="latexFile" type="file" required accept=".tex,text/plain" className="input" /></div><div><label className="label">Existing PDF (optional)</label><input name="pdfFile" type="file" accept=".pdf" className="input" /></div><div className="space-y-2"><label className="flex items-center gap-2 whitespace-nowrap text-xs"><input name="isDefault" type="checkbox" /> Set default</label><Button className="w-full" disabled={saving}><FilePlus2 size={16} /> Add resume</Button></div></form>
      </Card>

      <Card className="overflow-hidden border-red-100">
        <div className="border-b border-red-100 bg-red-50/70 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-red-900"><ShieldAlert size={20} /> Danger zone</h2>
          <p className="mt-1 text-sm text-red-700">Production maintenance actions. These are permanent and should only be used before a fresh upload.</p>
        </div>
        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <h3 className="font-semibold">Clear all campaign data</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">Deletes campaigns, contacts, company research, generated resumes/emails, Gmail draft records, sent-email records, automation jobs, and activity logs. Keeps profile/settings, API keys, Gmail OAuth tokens, and resume templates.</p>
            <label className="label mt-4">Type DELETE CAMPAIGNS to enable</label>
            <input className="input max-w-md font-mono" value={cleanupText} onChange={event => setCleanupText(event.target.value)} placeholder="DELETE CAMPAIGNS" />
          </div>
          <Button type="button" variant="danger" className="w-full justify-center" disabled={cleaningCampaigns || cleanupText !== "DELETE CAMPAIGNS"} onClick={clearCampaignData}>
            {cleaningCampaigns ? <Spinner /> : <Trash2 size={16} />} Clear campaign data
          </Button>
        </div>
      </Card>
    </div>
  </>;
}
