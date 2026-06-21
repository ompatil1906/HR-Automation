import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ColdMailOS", description: "Safe, personalized cold outreach automation for Om Patil" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
