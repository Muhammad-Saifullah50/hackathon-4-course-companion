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
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      {chapters.map((chapter) => (
        <li
          key={chapter.slug}
          onClick={() => onSelectChapter(chapter.slug)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #e5e7eb",
            cursor: "pointer",
          }}
        >
          <span>
            {chapter.order}. {chapter.title}
          </span>
        </li>
      ))}
    </ol>
  );
}
