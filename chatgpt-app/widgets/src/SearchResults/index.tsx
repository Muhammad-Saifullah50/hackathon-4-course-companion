import { ErrorPanel } from "../ErrorPanel";
import { Markdown } from "../Markdown";

interface SearchResult {
  chapter_slug: string;
  chapter_title: string;
  excerpt: string;
  accessible?: boolean;
  required_tier?: string | null;
}

interface SearchResultsProps {
  query: string;
  total_matches: number;
  results: SearchResult[];
  onSelectChapter: (slug: string) => void;
  error?: { message: string };
}

export function SearchResults({
  query,
  total_matches,
  results,
  onSelectChapter,
  error,
}: SearchResultsProps) {
  if (error) {
    return <ErrorPanel error={error} />;
  }

  return (
    <main className="widget-shell">
      <section className="surface" aria-labelledby="search-title">
        <header className="surface-header">
          <p className="eyebrow">Course search</p>
          <h1 id="search-title" className="title mt-1">
            Results for “{query}”
          </h1>
          <p className="muted mt-1">
            {total_matches} {total_matches === 1 ? "match" : "matches"} found
          </p>
        </header>

        {results.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <SearchIcon />
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No results found
            </p>
            <p className="muted mt-1">
              Try a broader keyword or browse the chapter list.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-700">
            {results.map((result) => (
              <li key={result.chapter_slug} className="px-4 py-4 sm:px-5">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {result.chapter_title}
                </h2>
                <div className="mt-2 line-clamp-4 text-zinc-600 dark:text-zinc-300">
                  {result.accessible === false ? (
                    <p>Upgrade to Premium to read this chapter.</p>
                  ) : (
                    <Markdown content={result.excerpt} compact />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    result.accessible !== false &&
                    onSelectChapter(result.chapter_slug)
                  }
                  disabled={result.accessible === false}
                  className="button-secondary mt-3"
                >
                  {result.accessible === false ? "Premium chapter" : "Read chapter"}
                  <ArrowRightIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="mx-auto size-7 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4.5 10h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
