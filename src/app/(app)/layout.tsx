import { Sidebar } from "@/components/sidebar";
import { Bell, ShieldCheck } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) { return <div><Sidebar/><header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-5 backdrop-blur lg:left-64"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><ShieldCheck size={17}/> Draft-first safety is active</div><Bell size={19} className="text-gray-400"/></header><main className="min-h-screen px-4 pb-12 pt-24 sm:px-7 lg:ml-64 lg:px-9">{children}</main></div>; }
