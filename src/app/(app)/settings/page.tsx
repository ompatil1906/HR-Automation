"use client";
import { useEffect, useState } from "react";
import { Button, Card, PageHeader, Spinner } from "@/components/ui";
import { CheckCircle2, KeyRound, Mail, ShieldAlert } from "lucide-react";

type Form = Record<string, any>;
const profileFields = [["Name","name"],["Email","email"],["Phone","phone"],["Location","location"],["LinkedIn","linkedin"],["GitHub","github"],["Education","education"]];
const descriptionFields = [["Experience summary","experienceSummary"],["AskLumenAI description","askLumenDescription"],["ViksitHub description","viksitHubDescription"],["XerXez description","xerxezDescription"],["Default email signature","defaultSignature"]];

export default function SettingsPage() {
  const [form, setForm] = useState<Form>();
  const [integrations, setIntegrations] = useState<any>();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/settings").then(r => r.json()).then(d => { setForm({ ...d.profile, targetRoles: (d.profile.targetRoles || []).join(", "), skills: (d.profile.skills || []).join(", "), tavilyApiKey: "", geminiApiKey: "" }); setIntegrations(d.integrations); }); }, []);
  if (!form) return <div className="grid h-80 place-items-center"><Spinner /></div>;
  const current = form;
  const set = (key: string, value: any) => setForm(previous => ({ ...previous, [key]: value }));
  async function save() {
    setSaving(true); setMsg("");
    const payload = { ...current, targetRoles: current.targetRoles.split(",").map((x: string) => x.trim()).filter(Boolean), skills: current.skills.split(",").map((x: string) => x.trim()).filter(Boolean), dailySendLimit: Number(current.dailySendLimit), sendDelaySeconds: Number(current.sendDelaySeconds) };
    const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setMsg(response.ok ? "Settings saved securely." : (await response.json()).error); setSaving(false);
  }
  return <>
    <PageHeader title="Settings & profile" description="The factual source of truth used by every prompt and safety check." action={<Button onClick={save} disabled={saving}>{saving && <Spinner />} Save changes</Button>} />
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="p-6"><h2 className="font-bold">Personal profile</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{profileFields.map(([label,key]) => <div key={key}><label className="label">{label}</label><input className="input" value={current[key] || ""} onChange={e => set(key,e.target.value)} /></div>)}</div></Card>
        <Card className="p-6"><h2 className="font-bold">Positioning</h2><div className="mt-5 space-y-4"><div><label className="label">Target roles (comma-separated)</label><textarea className="input min-h-24" value={current.targetRoles} onChange={e => set("targetRoles",e.target.value)} /></div><div><label className="label">Skills (comma-separated)</label><textarea className="input min-h-24" value={current.skills} onChange={e => set("skills",e.target.value)} /></div>{descriptionFields.map(([label,key]) => <div key={key}><label className="label">{label}</label><textarea className="input min-h-24" value={current[key] || ""} onChange={e => set(key,e.target.value)} /></div>)}</div></Card>
        <Card className="p-6"><h2 className="font-bold">Delivery guardrails</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><label className="label">Daily send limit</label><input type="number" className="input" value={current.dailySendLimit} onChange={e => set("dailySendLimit",e.target.value)} /></div><div><label className="label">Delay between sends (sec)</label><input type="number" className="input" min={5} value={current.sendDelaySeconds} onChange={e => set("sendDelaySeconds",e.target.value)} /></div><div><label className="label">Resume strategy</label><select className="input" value={current.defaultResumeStrategy} onChange={e => set("defaultResumeStrategy",e.target.value)}><option value="category">By company category</option><option value="role">By target role</option></select></div></div><label className="mt-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><input type="checkbox" checked={current.draftOnlyMode} onChange={e => set("draftOnlyMode",e.target.checked)} /><span><strong className="block text-sm text-amber-900">Draft-only mode</strong><small className="text-amber-700">When enabled, every send endpoint is blocked server-side.</small></span></label></Card>
      </div>
      <aside className="space-y-6">
        <Card className="p-6"><h2 className="flex items-center gap-2 font-bold"><Mail size={18}/> Gmail</h2><div className="mt-4 flex items-center gap-2 text-sm">{integrations?.gmail?.connected ? <><CheckCircle2 size={17} className="text-green-600"/><span>Connected as {integrations.gmail.email}</span></> : <><ShieldAlert size={17} className="text-amber-600"/><span>Not connected</span></>}</div><a className="btn btn-secondary mt-4 w-full" href="/api/gmail/oauth/start">{integrations?.gmail?.connected ? "Reconnect Gmail" : "Connect Gmail"}</a></Card>
        <Card className="p-6"><h2 className="flex items-center gap-2 font-bold"><KeyRound size={18}/> AI integrations</h2><p className="mt-2 text-xs leading-5 text-gray-500">Keys are encrypted with AES-256-GCM and never returned to this page.</p><div className="mt-4 space-y-4"><div><label className="label">Tavily key {integrations?.tavily && "✓"}</label><input type="password" className="input" placeholder={integrations?.tavily ? "Saved — enter to replace" : "tvly-..."} value={current.tavilyApiKey} onChange={e => set("tavilyApiKey",e.target.value)} /></div><div><label className="label">Gemini key {integrations?.gemini && "✓"}</label><input type="password" className="input" placeholder={integrations?.gemini ? "Saved — enter to replace" : "AIza..."} value={current.geminiApiKey} onChange={e => set("geminiApiKey",e.target.value)} /></div></div></Card>
        {msg && <div className={`rounded-xl p-4 text-sm ${msg.includes("saved") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}
      </aside>
    </div>
  </>;
}
