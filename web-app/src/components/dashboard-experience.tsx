import { ArrowRight, CheckCircle2, Flame, Search } from "lucide-react";
import Link from "next/link";

import type {
  ChapterSummary,
  ProgressResponse,
  UserProfile,
} from "@/lib/api-types";
import { completionMap, progressPercent } from "@/lib/progress";

function progressStats(
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

export function DashboardGreeting({ profile }: { profile: UserProfile }) {
  const name = profile.email.split("@")[0] || "learner";

  return (
    <h1 className="text-2xl font-semibold">Welcome back, {name}.</h1>
  );
}

export function DashboardProgressSummary({
  chapters,
  progress,
}: {
  chapters: ChapterSummary[];
  progress: ProgressResponse;
}) {
  return (
    <p className="muted mt-1">
      {completionMap(progress).size} of {chapters.length} chapters complete. Keep
      going.
    </p>
  );
}

export function DashboardLearning({
  chapters,
  progress,
}: {
  chapters: ChapterSummary[];
  progress: ProgressResponse;
}) {
  const { completed, percent } = progressStats(chapters, progress);
  const next = chapters.find((chapter) => !completed.has(chapter.slug));

  return (
    <div className="grid gap-5">
      {next ? (
        <section className="surface-card dashboard-continue">
          <p className="eyebrow">Continue learning</p>
          <h2>
            Chapter {next.order}: {next.title}
          </h2>
          <p className="muted">
            Continue your path through practical AI agent development.
          </p>
          <Link href={`/course/${next.slug}`} className="button-primary mt-5">
            {percent === 0 ? "Begin Chapter 1" : "Continue reading"}{" "}
            <ArrowRight size={15} />
          </Link>
        </section>
      ) : (
        <section className="surface-card dashboard-continue">
          <CheckCircle2 className="text-[var(--emerald)]" />
          <h2>Course complete</h2>
          <p className="muted">Review any chapter or retake a quiz.</p>
        </section>
      )}
      <section className="surface-card p-6">
        <p className="eyebrow mb-4">Course path</p>
        <div className="dashboard-path">
          {chapters.map((chapter) => {
            const entry = completed.get(chapter.slug);
            return (
              <Link href={`/course/${chapter.slug}`} key={chapter.slug}>
                {entry ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <span>{chapter.order}</span>
                )}
                <strong>{chapter.title}</strong>
                {entry?.quiz_score !== null &&
                entry?.quiz_score !== undefined ? (
                  <small>{entry.quiz_score}%</small>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function DashboardStats({
  chapters,
  progress,
}: {
  chapters: ChapterSummary[];
  progress: ProgressResponse;
}) {
  const { average, percent } = progressStats(chapters, progress);

  return (
    <>
      <section className="surface-card stat-card">
        <strong>{percent}%</strong>
        <span>course complete</span>
      </section>
      <section className="surface-card stat-card">
        <Flame className="text-orange-500" />
        <strong>{progress.current_streak}</strong>
        <span>day UTC streak</span>
      </section>
      <section className="surface-card stat-card">
        <strong>{average === null ? "—" : `${average}%`}</strong>
        <span>average quiz score</span>
      </section>
    </>
  );
}

export function DashboardSearchShortcut() {
  return (
    <Link href="/search" className="surface-card search-shortcut">
      <Search size={16} />
      <span>
        <strong>Search chapters</strong>
        <small>Find any course topic</small>
      </span>
      <ArrowRight size={14} />
    </Link>
  );
}
