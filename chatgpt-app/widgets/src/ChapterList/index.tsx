import { ErrorPanel } from "../ErrorPanel";

interface ChapterListProps {
  chapters: {
    slug: string;
    title: string;
    order: number;
  }[];
  onSelectChapter: (slug: string) => void;
  error?: { message: string };
}

export function ChapterList({
  chapters,
  onSelectChapter,
  error,
}: ChapterListProps) {
  if (error) {
    return <ErrorPanel error={error} />;
  }

  return (
    <main className="widget-shell">
      <section className="surface" aria-labelledby="chapter-list-title">
        <header className="surface-header">
          <p className="eyebrow">AI Agent Development</p>
          <div className="mt-1 flex items-end justify-between gap-4">
            <h1 id="chapter-list-title" className="title">
              Course chapters
            </h1>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {chapters.length} total
            </span>
          </div>
        </header>

        {chapters.length === 0 ? (
          <EmptyState message="No chapters are available yet." />
        ) : (
          <ol className="divide-y divide-zinc-200/80 dark:divide-zinc-700">
            {chapters.map((chapter) => (
              <li key={chapter.slug}>
                <button
                  type="button"
                  onClick={() => onSelectChapter(chapter.slug)}
                  className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-800 sm:px-5 dark:hover:bg-zinc-800/70 dark:focus-visible:outline-zinc-200"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-600 group-hover:bg-white dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-zinc-700">
                    {chapter.order}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {chapter.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      Open chapter
                    </span>
                  </span>
                  <ChevronRightIcon />
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="muted">{message}</p>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m7.5 4.5 5 5.5-5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
