"use client";
import { useEffect } from "react";
import { ErrorState } from "@/components/ui";

export default function AppError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const message = /table .* does not exist|P2021|relation .* does not exist/i.test(error.message)
    ? "Database schema is not initialized. Redeploy after configuring DATABASE_URL."
    : "The server could not load this page. Check the Vercel function logs and database configuration.";
  return <ErrorState message={message}/>;
}
