import { ErrorPanel } from "../ErrorPanel";
import { Markdown } from "../Markdown";

interface ChapterReaderProps {
  slug: string;
  title: string;
  content: string;
  order: number;
  next_slug: string | null;
  prev_slug: string | null;
  onNavigate: (slug: string) => void;
  error?: { message: string };
}

export function ChapterReader({
  title,
  content,
  order,
  next_slug,
  prev_slug,
  onNavigate,
  error,
}: ChapterReaderProps) {
  if (error) {
    return <ErrorPanel error={error} />;
  }

  const chapterContent = removeDuplicateTitle(content, title);

  return (
    <main className="widget-shell">
      <article className="surface">
        <header className="surface-header">
          <p className="eyebrow">Chapter {order || ""}</p>
          <h1 className="title mt-1">{title || "Untitled chapter"}</h1>
        </header>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {chapterContent.trim() ? (
            <Markdown content={chapterContent} />
          ) : (
            <p className="muted text-center">This chapter has no content yet.</p>
          )}
        </div>

        <nav
          aria-label="Chapter navigation"
          className="flex items-center justify-between gap-3 border-t border-zinc-200/80 px-4 py-4 sm:px-5 dark:border-zinc-700"
        >
          <button
            type="button"
            onClick={() => prev_slug && onNavigate(prev_slug)}
            disabled={prev_slug === null}
            className="button-secondary"
          >
            <ArrowLeftIcon />
            Previous
          </button>
          <button
            type="button"
            onClick={() => next_slug && onNavigate(next_slug)}
            disabled={next_slug === null}
            className="button-primary"
          >
            Next
            <ArrowRightIcon />
          </button>
        </nav>
      </article>
    </main>
  );
}

function removeDuplicateTitle(content: string, title: string): string {
  const [firstLine = "", ...remainingLines] = content.split(/\r?\n/);
  return firstLine.trim() === `# ${title.trim()}`
    ? remainingLines.join("\n").trimStart()
    : content;
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M15.5 10h-11m4-4-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4.5 10h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
