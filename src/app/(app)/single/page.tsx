"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button, Card, PageHeader, Spinner } from "@/components/ui";

const initial = { hrEmail: "", hrName: "", companyName: "", companyWebsite: "", linkedinUrl: "", targetRole: "", extraNote: "" };

export default function SinglePage() {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function start() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/single/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start automation");
      router.push(`/campaigns/${data.campaignId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start automation");
      setBusy(false);
    }
  }

  return <>
    <PageHeader title="Single company outreach" description="Enter the contact once; research, resume generation, and email generation continue automatically." />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Search size={19} /></span><div><h2 className="font-bold">Contact and company</h2><p className="text-xs text-gray-500">Required information is validated before the job is queued.</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{[["HR email *","hrEmail","email"],["HR name","hrName","text"],["Company name *","companyName","text"],["Company website","companyWebsite","url"],["LinkedIn URL","linkedinUrl","url"],["Target role","targetRole","text"]].map(([label,key,type]) => <div key={key}><label className="label">{label}</label><input type={type} className="input" value={(form as any)[key]} onChange={event => set(key,event.target.value)} /></div>)}</div>
        <div className="mt-4"><label className="label">Extra personalization note</label><textarea className="input min-h-24" value={form.extraNote} onChange={event => set("extraNote",event.target.value)} /></div>
        {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <Button className="mt-6 w-full sm:w-auto" onClick={start} disabled={busy || !form.hrEmail || !form.companyName}>{busy ? <Spinner /> : <Zap size={16} />} Start automatic pipeline</Button>
      </Card>
      <aside className="space-y-5">
        <Card className="p-5"><h2 className="flex items-center gap-2 font-bold"><Sparkles size={17} /> Automatic workflow</h2><div className="mt-4 space-y-3">{["Verified company research","Company-matched PDF resume","Personalized email and quality check","Manual review before delivery","Gmail draft after approval"].map((label,index) => <div key={label} className="flex items-center gap-3 text-sm"><span className={`grid size-7 place-items-center rounded-full ${index < 3 ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"}`}>{index < 3 ? <Check size={14} /> : index + 1}</span>{label}</div>)}</div></Card>
        <Card className="border-emerald-200 bg-emerald-50 p-5"><h2 className="flex items-center gap-2 font-bold text-emerald-900"><ShieldCheck size={17} /> Sending stays manual</h2><p className="mt-2 text-sm leading-6 text-emerald-800">Automation stops at review. Approval creates an individual Gmail draft; sending still requires explicit confirmation.</p></Card>
      </aside>
    </div>
  </>;
}
