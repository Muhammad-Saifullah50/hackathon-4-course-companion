"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="protected-empty">
      <AlertTriangle size={28} className="text-[var(--danger)]" />
      <h1>Service unavailable</h1>
      <p>Claude Teacher could not load this page. Please try again.</p>
      <button className="button-primary" onClick={reset}>Try again</button>
    </div>
  );
}
