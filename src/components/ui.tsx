import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({ children, variant = "primary", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) { return <button className={cn("btn", `btn-${variant}`, className)} {...props}>{children}</button>; }
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <div className={cn("card", className)}>{children}</div>; }
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: string }) { const colors: Record<string,string> = { blue: "bg-blue-50 text-blue-700", purple: "bg-purple-50 text-purple-700", green: "bg-green-50 text-green-700", teal: "bg-teal-50 text-teal-700", yellow: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", gray: "bg-gray-100 text-gray-700" }; return <span className={cn("badge", colors[tone] || colors.gray)}>{children}</span>; }
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">{title}</h1>{description && <p className="mt-1 text-sm text-gray-500">{description}</p>}</div>{action}</div>; }
export function Spinner() { return <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />; }
