import type { ErrorState } from "../types";

interface ErrorPanelProps {
  error: ErrorState;
}

export function ErrorPanel({ error }: ErrorPanelProps) {
  return (
    <main className="widget-shell">
      <div
        role="alert"
        className="surface flex items-start gap-3 border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-100"
      >
        <svg
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 6.5v4.25M10 14h.01" strokeLinecap="round" />
        </svg>
        <div>
          <p className="text-sm font-semibold">Something went wrong</p>
          <p className="mt-1 text-sm leading-6 text-red-800 dark:text-red-200">
            {error.message}
          </p>
        </div>
      </div>
    </main>
  );
}
