"use client";
import { useEffect, useState } from "react";
import { Download, FileArchive, FileSpreadsheet, Mails, ScrollText } from "lucide-react";
import { Card, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { fetchJson } from "@/lib/client-api";
const formats = [["Campaign tracker","Complete Excel workbook","xlsx",FileSpreadsheet],["Generated emails","Subjects, bodies, and follow-ups as CSV","emails",Mails],["Company résumés","All generated PDFs in a ZIP","resumes",FileArchive],["Campaign logs","Audit trail as CSV","logs",ScrollText]] as const;
export default function ExportPage() {
  const [data,setData] = useState<any[]>(); const [selected,setSelected] = useState(""); const [error,setError] = useState("");
  useEffect(() => { fetchJson<any[]>("/api/campaigns").then(d => { setData(d); if (d[0]) setSelected(d[0].id); }).catch(e => setError(e.message)); }, []);
  if (error) return <ErrorState message={error}/>;
  return <><PageHeader title="Tracker & exports" description="Take campaign data, generated artifacts, and audit logs with you."/><Card className="p-6"><label className="label">Campaign</label>{!data ? <Spinner/> : <select className="input max-w-xl" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose a campaign</option>{data.map(c => <option value={c.id} key={c.id}>{c.name} · {c.totalRows} contacts</option>)}</select>}</Card><div className="mt-6 grid gap-4 sm:grid-cols-2">{formats.map(([title,desc,format,Icon]) => <Card key={format} className="flex items-center gap-4 p-6"><span className="grid size-12 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon/></span><div className="flex-1"><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-gray-500">{desc}</p></div><a className={`btn btn-secondary ${!selected ? "pointer-events-none opacity-50" : ""}`} href={`/api/export/${selected}?format=${format}`}><Download size={16}/></a></Card>)}</div></>;
}
