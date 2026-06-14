import { ArrowRight, CheckCircle2, Circle, Flame, HelpCircle } from "lucide-react";
import Link from "next/link";

import type { ChapterSummary, ProgressResponse } from "@/lib/api-types";
import { completionMap, progressPercent } from "@/lib/progress";

function getProgressStats(
  chapters: ChapterSummary[],
  progress: ProgressResponse,
) {
  const completed = completionMap(progress);
  const percent = progressPercent(chapters, progress);
  const scores = [...completed.values()]
    .map((item) => item.quiz_score)
    .filter((score): score is number => score !== null);
  const average = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
  return { average, completed, percent };
}

export function ProgressStats({
  chapters,
  progress,
}: {
  chapters: ChapterSummary[];
  progress: ProgressResponse;
}) {
  const { average, completed, percent } = getProgressStats(chapters, progress);

  return (
    <div className="stats-grid">
      <div className="surface-card stat-card">
        <strong>{percent}%</strong>
        <span>
          {completed.size}/{chapters.length} chapters
        </span>
      </div>
      <div className="surface-card stat-card">
        <Flame className="text-orange-500" />
        <strong>{progress.current_streak}</strong>
        <span>day streak</span>
      </div>
      <div className="surface-card stat-card">
        <HelpCircle className="text-[var(--indigo)]" />
        <strong>{average === null ? "—" : `${average}%`}</strong>
        <span>average score</span>
      </div>
      <div className="surface-card stat-card">
        <CheckCircle2 className="text-[var(--emerald)]" />
        <strong>{completed.size}</strong>
        <span>quizzes saved</span>
      </div>
    </div>
  );
}

export function ProgressBreakdown({
  chapters,
  progress,
}: {
  chapters: ChapterSummary[];
  progress: ProgressResponse;
}) {
  const completed = completionMap(progress);

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--border)] p-5">
        <h2 className="font-semibold">Chapter breakdown</h2>
      </div>
      <div className="progress-list">
        {chapters.map((chapter) => {
          const entry = completed.get(chapter.slug);
          return (
            <div key={chapter.slug}>
              {entry ? <CheckCircle2 size={19} /> : <Circle size={19} />}
              <span>
                <strong>{chapter.title}</strong>
                {entry && (
                  <small>
                    Completed{" "}
                    {new Date(entry.completed_at).toLocaleDateString()}
                  </small>
                )}
              </span>
              {entry?.quiz_score !== null &&
              entry?.quiz_score !== undefined ? (
                <b>{entry.quiz_score}%</b>
              ) : null}
              <Link href={`/course/${chapter.slug}`}>
                {entry ? "Review" : "Read"} <ArrowRight size={12} />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ProgressTimezoneNote() {
  return (
    <p className="surface-card muted mt-5 p-4 text-xs">
      Streak days are calculated in UTC. A day counts when a chapter completion
      and quiz score are saved.
    </p>
  );
}
