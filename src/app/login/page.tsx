"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { ShieldCheck } from "lucide-react";

function LoginForm() { const [password,setPassword]=useState("");const [error,setError]=useState("");const router=useRouter();const params=useSearchParams(); async function login(e:React.FormEvent){e.preventDefault();setError("");const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});if(!r.ok){setError((await r.json()).error);return;}router.push(params.get("next")||"/dashboard");router.refresh();} return <main className="grid min-h-screen place-items-center bg-[#0c1020] p-5"><Card className="w-full max-w-md p-8"><span className="mb-5 grid size-12 place-items-center rounded-xl bg-violet-100 text-violet-700"><ShieldCheck/></span><h1 className="text-2xl font-bold">Owner sign in</h1><p className="mt-2 text-sm text-gray-500">This workspace can create real Gmail messages, so it stays private.</p><form onSubmit={login} className="mt-7 space-y-4"><div><label className="label">Admin password</label><input autoFocus className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Configured in Vercel"/></div>{error&&<p className="text-sm text-red-600">{error}</p>}<Button className="w-full">Open workspace</Button></form></Card></main>; }

export default function LoginPage() { return <Suspense fallback={<main className="grid min-h-screen place-items-center"><span>Loading…</span></main>}><LoginForm /></Suspense>; }
