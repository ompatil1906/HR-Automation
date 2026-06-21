"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileSpreadsheet, Files, LayoutDashboard, ListChecks, LogOut, MailPlus, ScrollText, Settings, Upload, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  ["Dashboard", "/dashboard", LayoutDashboard], ["Upload HR Sheet", "/upload", Upload], ["Campaigns", "/campaigns", ListChecks],
  ["Single Outreach", "/single", MailPlus], ["Resume Manager", "/resumes", Files], ["Tracker Export", "/export", FileSpreadsheet],
  ["Activity Logs", "/logs", ScrollText], ["Settings", "/settings", Settings],
] as const;

export function Sidebar() {
  const pathname = usePathname(); const router = useRouter();
  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
    <Link href="/dashboard" className="flex h-20 items-center gap-3 border-b border-gray-100 px-6"><span className="grid size-10 place-items-center rounded-xl bg-[#6d5dfc] text-white"><Zap size={21} fill="currentColor" /></span><span><strong className="block text-lg">ColdMailOS</strong><small className="text-gray-400">Outreach, with guardrails</small></span></Link>
    <nav className="flex-1 space-y-1 p-4">{items.map(([label, href, Icon]) => { const active = pathname === href || (href === "/campaigns" && pathname.startsWith("/campaigns/")); return <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}><Icon size={18} />{label}</Link>; })}</nav>
    <div className="border-t border-gray-100 p-4"><div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3"><span className="grid size-9 place-items-center rounded-full bg-gray-900 text-sm font-bold text-white">OP</span><span className="min-w-0"><strong className="block truncate text-sm">Om Patil</strong><small className="block truncate text-gray-500">Owner workspace</small></span></div><button className="flex w-full items-center gap-2 px-3 text-sm text-gray-500" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});router.push("/");}}><LogOut size={16}/> Sign out</button></div>
  </aside>;
}
