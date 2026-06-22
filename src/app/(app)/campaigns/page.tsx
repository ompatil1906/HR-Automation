"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Badge, Button, Card, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { fetchJson } from "@/lib/client-api";

export default function CampaignsPage() {
  const [data, setData] = useState<any[]>(); const [error, setError] = useState("");
  useEffect(() => { fetchJson<any[]>("/api/campaigns").then(setData).catch(e => setError(e.message)); }, []);
  if (error) return <ErrorState message={error} />;
  return <><PageHeader title="Campaigns" description="One upload, one independently tracked outreach campaign." action={<Link href="/upload"><Button><Plus size={17}/> New campaign</Button></Link>}/>{!data ? <div className="grid h-72 place-items-center"><Spinner/></div> : data.length === 0 ? <Card className="grid min-h-72 place-items-center p-8 text-center"><div><h2 className="text-lg font-bold">No campaigns yet</h2><p className="mt-2 text-sm text-gray-500">Upload the HR spreadsheet to start your first one.</p><Link href="/upload" className="btn btn-primary mt-5">Upload contacts</Link></div></Card> : <Card className="overflow-hidden"><div className="table-wrap"><table><thead><tr><th>Campaign</th><th>Contacts</th><th>Researched</th><th>Emails</th><th>Drafts</th><th>Sent</th><th>Status</th><th></th></tr></thead><tbody>{data.map(c => <tr key={c.id}><td><strong>{c.name}</strong><small className="block text-gray-400">{new Date(c.createdAt).toLocaleDateString()} · {c.uploadedFileName || "Single mode"}</small></td><td>{c.totalRows}</td><td>{c.metrics.researched}</td><td>{c.metrics.emails}</td><td>{c.metrics.drafts}</td><td>{c.metrics.sent}</td><td><Badge tone={c.status === "READY" ? "green" : c.status === "FAILED" ? "red" : "blue"}>{c.status}</Badge></td><td><Link className="btn btn-secondary !px-3 !py-2" href={`/campaigns/${c.id}`}>Open <ArrowRight size={15}/></Link></td></tr>)}</tbody></table></div></Card>}</>;
}
