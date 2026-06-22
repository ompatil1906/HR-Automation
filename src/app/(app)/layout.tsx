import { Sidebar } from "@/components/sidebar";
import { Bell, ShieldCheck } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) { return <div><Sidebar/><header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 pl-16 pr-4 backdrop-blur sm:px-5 sm:pl-20 lg:left-64 lg:pl-6"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 sm:text-sm"><ShieldCheck size={17}/><span className="hidden sm:inline">Draft-first safety is active</span><span className="sm:hidden">Draft-first</span></div><Bell size={19} className="text-gray-400"/></header><main className="min-h-screen min-w-0 px-3 pb-12 pt-20 sm:px-7 sm:pt-24 lg:ml-64 lg:px-9">{children}</main></div>; }
