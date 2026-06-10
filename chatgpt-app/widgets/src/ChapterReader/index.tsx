import { ErrorPanel } from "../ErrorPanel";

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
  slug,
  title,
  content,
  next_slug,
  prev_slug,
  onNavigate,
  error,
}: ChapterReaderProps) {
  if (error) {
    return <ErrorPanel error={error} />;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>{title}</h1>

      <div dangerouslySetInnerHTML={{ __html: content }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "2rem",
          gap: "1rem",
        }}
      >
        <button
          onClick={() => prev_slug && onNavigate(prev_slug)}
          disabled={prev_slug === null}
          style={{
            padding: "0.5rem 1rem",
            cursor: prev_slug ? "pointer" : "not-allowed",
            opacity: prev_slug ? 1 : 0.4,
          }}
        >
          ← Previous
        </button>

        <button
          onClick={() => next_slug && onNavigate(next_slug)}
          disabled={next_slug === null}
          style={{
            padding: "0.5rem 1rem",
            cursor: next_slug ? "pointer" : "not-allowed",
            opacity: next_slug ? 1 : 0.4,
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
