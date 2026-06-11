import { ErrorPanel } from "../ErrorPanel";

interface AccessStatusProps {
  tier: string;
  allowed: boolean;
  resource?: string | null;
  upgrade_url?: string | null;
  error?: { message: string };
}

export function AccessStatus({
  tier,
  allowed,
  resource,
  upgrade_url,
  error,
}: AccessStatusProps) {
  if (error) {
    return <ErrorPanel error={error} />;
  }

  const isPremium = tier === "premium";

  return (
    <main className="widget-shell max-w-xl">
      <section className="surface p-5 sm:p-6" aria-labelledby="access-title">
        <div className="flex items-start gap-4">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
              isPremium
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {isPremium ? <SparkIcon /> : <UserIcon />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 id="access-title" className="title">
                {isPremium ? "Premium access" : "Free access"}
              </h1>
              <span
                className={`badge ${
                  isPremium
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                {isPremium ? "Premium" : "Free"}
              </span>
            </div>

            <p className="muted mt-2">
              {isPremium
                ? "AI tutoring, hints, and personalized explanations are available."
                : "Course chapters, quizzes, search, and progress tracking are included."}
            </p>

            {resource && !allowed && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                Premium access is required for {resource}.
              </p>
            )}

            {!isPremium && upgrade_url && (
              <a
                className="button-primary mt-4"
                href={upgrade_url}
                target="_blank"
                rel="noreferrer noopener"
              >
                Upgrade to Premium
                <ExternalLinkIcon />
              </a>
            )}

            {isPremium && (
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                <CheckIcon />
                Your premium benefits are active
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="10" cy="7" r="3" />
      <path d="M4.5 16c.7-3 2.5-4.5 5.5-4.5s4.8 1.5 5.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.6-2.9-7-7.5-7.5 4.6-.5 7-2.9 7.5-7.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 10 3.2 3.2L15 6.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 4h5v5M9 11l7-7M15 11v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
