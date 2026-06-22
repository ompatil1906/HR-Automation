"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileCode2, FilePlus2, KeyRound, Mail, Save, ShieldAlert } from "lucide-react";
import { Button, Card, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { fetchJson } from "@/lib/client-api";

type Form = Record<string, any>;
type ResumeTemplate = {
  id: string;
  name: string;
  type: string;
  currentLatex: string;
  isDefault: boolean;
  updatedAt: string;
};

const resumeTypes = ["BASE", "AI_ML", "GENAI", "BACKEND", "FULL_STACK", "MNC", "RESEARCH"];
const profileFields = [
  ["Name", "name"], ["Email", "email"], ["Phone", "phone"], ["Location", "location"],
  ["LinkedIn", "linkedin"], ["GitHub", "github"], ["Education", "education"],
];
const descriptionFields = [
  ["Experience summary", "experienceSummary"], ["AskLumenAI description", "askLumenDescription"],
  ["ViksitHub description", "viksitHubDescription"], ["XerXez description", "xerxezDescription"],
  ["Default email signature", "defaultSignature"],
];

export default function SettingsPage() {
  const [form, setForm] = useState<Form>();
  const [integrations, setIntegrations] = useState<any>();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [selected, setSelected] = useState<ResumeTemplate>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [settings, resumes] = await Promise.all([
        fetchJson<any>("/api/settings"),
        fetchJson<ResumeTemplate[]>("/api/resumes"),
      ]);
      setForm({
        ...settings.profile,
        targetRoles: Array.isArray(settings.profile?.targetRoles) ? settings.profile.targetRoles.join(", ") : "",
        skills: Array.isArray(settings.profile?.skills) ? settings.profile.skills.join(", ") : "",
        tavilyApiKey: "",
        geminiApiKey: "",
      });
      setIntegrations(settings.integrations);
      setTemplates(Array.isArray(resumes) ? resumes : []);
      setSelected(current => {
        if (current) return resumes.find(item => item.id === current.id) || current;
        const template = resumes.find(item => item.isDefault) || resumes[0];
        return template ? { ...template } : undefined;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load settings");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message={error} />;
  if (!form) return <div className="grid h-80 place-items-center"><Spinner /></div>;

  const current = form;
  const set = (key: string, value: any) => setForm(previous => ({ ...previous, [key]: value }));

  async function saveProfile() {
    const payload = {
      ...current,
      targetRoles: current.targetRoles.split(",").map((value: string) => value.trim()).filter(Boolean),
      skills: current.skills.split(",").map((value: string) => value.trim()).filter(Boolean),
      dailySendLimit: Number(current.dailySendLimit),
      sendDelaySeconds: Number(current.sendDelaySeconds),
    };
    await fetchJson("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function saveResume() {
    if (!selected) return;
    await fetchJson("/api/resumes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    });
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");
    try {
      await saveProfile();
      await saveResume();
      setMessage(selected ? "User information and LaTeX resume saved." : "User information saved.");
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadResume(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    data.set("isDefault", String(data.get("isDefault") === "on"));
    try {
      await fetchJson("/api/resumes", { method: "POST", body: data });
      setMessage("New immutable LaTeX resume source saved.");
      event.currentTarget.reset();
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Resume upload failed");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <PageHeader
      title="Settings"
      description="Manage Om's source-of-truth information and the LaTeX resume used for personalization."
      action={<Button onClick={saveAll} disabled={saving}>{saving ? <Spinner /> : <Save size={16} />} Save all changes</Button>}
    />

    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b p-6">
          <h2 className="text-lg font-bold">1. User information</h2>
          <p className="mt-1 text-sm text-gray-500">Profile, experience, outreach preferences, safety controls, and private integrations.</p>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900">Personal details</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profileFields.map(([label, key]) => <div key={key}>
              <label className="label">{label}</label>
              <input className="input" value={current[key] || ""} onChange={event => set(key, event.target.value)} />
            </div>)}
          </div>
        </div>

        <div className="border-t p-6">
          <h3 className="text-sm font-semibold text-gray-900">Positioning and experience</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div><label className="label">Target roles (comma-separated)</label><textarea className="input min-h-24" value={current.targetRoles} onChange={event => set("targetRoles", event.target.value)} /></div>
            <div><label className="label">Skills (comma-separated)</label><textarea className="input min-h-24" value={current.skills} onChange={event => set("skills", event.target.value)} /></div>
            {descriptionFields.map(([label, key]) => <div key={key} className={key === "defaultSignature" ? "lg:col-span-2" : ""}>
              <label className="label">{label}</label>
              <textarea className="input min-h-28" value={current[key] || ""} onChange={event => set(key, event.target.value)} />
            </div>)}
          </div>
        </div>

        <div className="border-t p-6">
          <h3 className="text-sm font-semibold text-gray-900">Outreach guardrails</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div><label className="label">Daily send limit</label><input type="number" min={1} max={100} className="input" value={current.dailySendLimit} onChange={event => set("dailySendLimit", event.target.value)} /></div>
            <div><label className="label">Delay between sends (seconds)</label><input type="number" min={5} max={3600} className="input" value={current.sendDelaySeconds} onChange={event => set("sendDelaySeconds", event.target.value)} /></div>
            <div><label className="label">Resume strategy</label><select className="input" value={current.defaultResumeStrategy} onChange={event => set("defaultResumeStrategy", event.target.value)}><option value="category">By company category</option><option value="role">By target role</option></select></div>
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <input type="checkbox" checked={Boolean(current.draftOnlyMode)} onChange={event => set("draftOnlyMode", event.target.checked)} />
            <span><strong className="block text-sm text-amber-900">Draft-only mode</strong><small className="text-amber-700">Blocks every send endpoint server-side until you explicitly disable it.</small></span>
          </label>
        </div>

        <div className="grid border-t lg:grid-cols-2 lg:divide-x">
          <div className="p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Mail size={17} /> Gmail</h3>
            <div className="mt-3 flex items-center gap-2 text-sm">
              {integrations?.gmail?.connected ? <><CheckCircle2 size={17} className="text-green-600" /><span>Connected as {integrations.gmail.email}</span></> : <><ShieldAlert size={17} className="text-amber-600" /><span>Not connected</span></>}
            </div>
            <a className="btn btn-secondary mt-4" href="/api/gmail/oauth/start">{integrations?.gmail?.connected ? "Reconnect Gmail" : "Connect Gmail"}</a>
          </div>
          <div className="border-t p-6 lg:border-t-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><KeyRound size={17} /> AI integrations</h3>
            <p className="mt-2 text-xs leading-5 text-gray-500">Keys are encrypted server-side and never returned to the browser.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="label">Tavily key {integrations?.tavily && "✓"}</label><input type="password" className="input" placeholder={integrations?.tavily ? "Saved — enter to replace" : "tvly-..."} value={current.tavilyApiKey} onChange={event => set("tavilyApiKey", event.target.value)} /></div>
              <div><label className="label">Gemini key {integrations?.gemini && "✓"}</label><input type="password" className="input" placeholder={integrations?.gemini ? "Saved — enter to replace" : "AIza..."} value={current.geminiApiKey} onChange={event => set("geminiApiKey", event.target.value)} /></div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold"><FileCode2 size={20} /> 2. LaTeX resume</h2>
            <p className="mt-1 text-sm text-gray-500">Edit the working copy. The original uploaded source remains immutable.</p>
          </div>
          {templates.length > 0 && <select
            className="input min-w-64"
            value={selected?.id || ""}
            onChange={event => {
              const template = templates.find(item => item.id === event.target.value);
              setSelected(template ? { ...template } : undefined);
            }}
          >{templates.map(template => <option key={template.id} value={template.id}>{template.name}{template.isDefault ? " — Default" : ""}</option>)}</select>}
        </div>

        {selected ? <div className="p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div><label className="label">Template name</label><input className="input" value={selected.name} onChange={event => setSelected({ ...selected, name: event.target.value })} /></div>
            <div><label className="label">Resume type</label><select className="input" value={selected.type} onChange={event => setSelected({ ...selected, type: event.target.value })}>{resumeTypes.map(type => <option key={type}>{type}</option>)}</select></div>
          </div>
          <div className="mt-4">
            <label className="label">LaTeX source code</label>
            <textarea spellCheck={false} className="input min-h-[620px] resize-y bg-[#101828] font-mono text-xs leading-5 text-gray-100" value={selected.currentLatex} onChange={event => setSelected({ ...selected, currentLatex: event.target.value })} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.isDefault} onChange={event => setSelected({ ...selected, isDefault: event.target.checked })} /> Use as default base resume</label>
        </div> : <div className="p-6 text-sm text-gray-500">No LaTeX resume has been added yet. Upload the immutable base source below.</div>}

        <form onSubmit={uploadResume} className="grid gap-4 border-t bg-gray-50 p-6 md:grid-cols-2 xl:grid-cols-[1fr_180px_1fr_1fr_auto] xl:items-end">
          <div><label className="label">New template name</label><input name="name" className="input" required placeholder="Om — Master Resume" /></div>
          <div><label className="label">Type</label><select name="type" className="input">{resumeTypes.map(type => <option key={type}>{type}</option>)}</select></div>
          <div><label className="label">LaTeX file (.tex)</label><input name="latexFile" type="file" required accept=".tex,text/plain" className="input" /></div>
          <div><label className="label">Existing PDF (optional)</label><input name="pdfFile" type="file" accept=".pdf" className="input" /></div>
          <div className="space-y-2"><label className="flex items-center gap-2 whitespace-nowrap text-xs"><input name="isDefault" type="checkbox" /> Set default</label><Button className="w-full" disabled={saving}><FilePlus2 size={16} /> Add resume</Button></div>
        </form>
      </Card>

      {message && <div className={`rounded-xl p-4 text-sm ${message.toLowerCase().includes("saved") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</div>}
    </div>
  </>;
}
