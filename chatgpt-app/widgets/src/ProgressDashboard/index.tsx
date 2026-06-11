import { ErrorPanel } from "../ErrorPanel";

interface ChapterProgressItem {
  slug: string;
  title: string;
  completed: boolean;
  quiz_score: number | null;
}

interface ProgressDashboardProps {
  user_id: string;
  current_streak: number;
  completion_percentage: number;
  total_chapters: number;
  completed_chapters: number;
  chapter_list: ChapterProgressItem[];
  onSelectChapter: (slug: string) => void;
  error?: { message: string };
}

export function ProgressDashboard({
  current_streak,
  completion_percentage,
  total_chapters,
  completed_chapters,
  chapter_list,
  onSelectChapter,
  error,
}: ProgressDashboardProps) {
  if (error) {
    return <ErrorPanel error={error} />;
  }

  const progress = Math.min(100, Math.max(0, completion_percentage));

  return (
    <main className="widget-shell">
      <section className="surface" aria-labelledby="progress-title">
        <header className="surface-header">
          <p className="eyebrow">Learning progress</p>
          <h1 id="progress-title" className="title mt-1">
            Your course journey
          </h1>
        </header>

        <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
          <MetricCard
            label="Current streak"
            value={`${current_streak} ${current_streak === 1 ? "day" : "days"}`}
          />
          <MetricCard
            label="Chapters complete"
            value={`${completed_chapters}/${total_chapters}`}
          />
        </div>

        <div className="px-4 pb-5 sm:px-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Overall completion
            </span>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Course completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 motion-reduce:transition-none dark:bg-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {chapter_list.length === 0 ? (
          <div className="border-t border-zinc-200/80 px-5 py-10 text-center dark:border-zinc-700">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Start your first chapter
            </p>
            <p className="muted mt-1">
              Your completed chapters and quiz scores will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200/80 border-t border-zinc-200/80 dark:divide-zinc-700 dark:border-zinc-700">
            {chapter_list.map((chapter) => (
              <li key={chapter.slug}>
                <button
                  type="button"
                  onClick={() => onSelectChapter(chapter.slug)}
                  className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-800 sm:px-5 dark:hover:bg-zinc-800/70 dark:focus-visible:outline-zinc-200"
                >
                  <StatusIcon completed={chapter.completed} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {chapter.title}
                  </span>
                  {chapter.quiz_score !== null && (
                    <span className="badge border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {chapter.quiz_score}%
                    </span>
                  )}
                  <ChevronRightIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-700 dark:bg-zinc-800/60">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function StatusIcon({ completed }: { completed: boolean }) {
  return (
    <span
      aria-label={completed ? "Completed" : "Not completed"}
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
        completed
          ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-zinc-950"
          : "border-zinc-300 text-transparent dark:border-zinc-600"
      }`}
    >
      <svg aria-hidden="true" className="size-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="m5 10 3.2 3.2L15 6.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" className="size-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m7.5 4.5 5 5.5-5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
