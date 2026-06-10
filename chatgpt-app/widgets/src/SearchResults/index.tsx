import { ErrorPanel } from "../ErrorPanel";

interface SearchResult {
  chapter_slug: string;
  chapter_title: string;
  excerpt: string;
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
    <div style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 0.25rem" }}>
          Search results for &ldquo;{query}&rdquo;
        </h2>
        <p style={{ margin: 0, color: "#6b7280" }}>
          {total_matches} match(es) found
        </p>
      </div>

      {results.length === 0 ? (
        <p style={{ color: "#6b7280" }}>
          No results found. Try browsing all chapters instead.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {results.map((result) => (
            <li
              key={result.chapter_slug}
              style={{
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "1rem",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: "0 0 0.5rem" }}>{result.chapter_title}</h3>
              <p style={{ margin: "0 0 0.75rem", color: "#374151" }}>
                {result.excerpt}
              </p>
              <button
                onClick={() => onSelectChapter(result.chapter_slug)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                Read Chapter
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
