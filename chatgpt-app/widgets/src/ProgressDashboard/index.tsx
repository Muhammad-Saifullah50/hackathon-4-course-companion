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
  completed_chapters,
  chapter_list,
  onSelectChapter,
  error,
}: ProgressDashboardProps) {
  if (error) {
    return <ErrorPanel error={error} />;
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      {/* Streak */}
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          textAlign: "center",
          padding: "1rem",
          color: "#f97316",
        }}
      >
        🔥 {current_streak} day streak
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 1rem 1rem" }}>
        <div
          style={{
            background: "#e5e7eb",
            borderRadius: "9999px",
            height: "1rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${completion_percentage}%`,
              background: "#16a34a",
              height: "100%",
              borderRadius: "9999px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <p
          style={{
            textAlign: "center",
            marginTop: "0.5rem",
            color: "#374151",
            fontWeight: "500",
          }}
        >
          {completion_percentage.toFixed(0)}% Complete
        </p>
      </div>

      {/* Chapter list or empty state */}
      {completed_chapters === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            color: "#6b7280",
          }}
        >
          <p>You haven&apos;t completed any chapters yet — let&apos;s get started! 🚀</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {chapter_list.map((chapter) => (
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
              <span>{chapter.title}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {chapter.quiz_score !== null && (
                  <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    {chapter.quiz_score}%
                  </span>
                )}
                {chapter.completed && (
                  <span style={{ color: "#16a34a", fontWeight: "bold" }}>✓</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
