import { ArrowRight, BookOpen, CheckCircle2, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CourseProgressOverlay } from "@/components/course-progress-overlay";
import { CourseProgressSkeleton } from "@/components/loading-ui";
import type { BillingStatus, ProgressResponse } from "@/lib/api-types";
import { getOptionalSession } from "@/lib/auth-dal";
import {
  getServerBillingStatus,
  getServerChapters,
  getServerProgress,
} from "@/lib/authenticated-api";
import { courseMeta } from "@/lib/course-meta";
import { getChapters } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Course | Claude Teacher",
  description: "Five focused chapters on building reliable AI agents.",
};

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      cookies: [{ name: "stytch_session", value: null }],
    },
  ],
};

async function ProgressBadge({
  progress,
  slug,
}: {
  progress: Promise<ProgressResponse | null>;
  slug: string;
}) {
  return <CourseProgressOverlay progress={await progress} slug={slug} />;
}

async function ViewerNotice({
  billing,
}: {
  billing: Promise<BillingStatus | null>;
}) {
  const value = await billing;
  if (value?.tier && value.tier !== "free") return null;
  if (value?.tier === "free") {
    return (
      <aside className="save-notice">
        Upgrade to Premium to unlock all chapters, quizzes, and saved progress.
        <Link href="/account"> View plans</Link>
      </aside>
    );
  }
  return (
    <aside className="save-notice">
      Create a Free account for the first three chapters and their quizzes.
      <Link href="/signup"> Create a free account</Link>
    </aside>
  );
}

export default async function CoursePage() {
  const session = getOptionalSession();
  const billing = session.then((value) =>
    value ? getServerBillingStatus() : null,
  );
  const chapters = session.then((value) =>
    value ? getServerChapters() : getChapters(),
  );
  const progress = Promise.all([session, billing]).then(([value, plan]) =>
    value && plan?.tier !== "free"
      ? getServerProgress(value.user_id)
      : null,
  );
  const chapterList = await chapters;

  return (
    <div className="page-shell">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow mb-2">AI Agent Development</p>
        <h1 className="text-3xl font-semibold tracking-tight">Course chapters</h1>
        <p className="muted mt-3 leading-7">
          Move from the Claude Agent SDK foundations through MCP servers and
          reusable agent skills. Free learners get the first three chapters;
          Premium unlocks the full course and progress tracking.
        </p>
      </header>
      <div className="course-list">
        {chapterList.map((chapter, index) => {
          const meta = courseMeta(chapter.slug);
          const accessible = chapter.accessible !== false;
          return (
            <article className="course-card" key={chapter.slug}>
              <div className="chapter-number">{chapter.order}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2>{chapter.title}</h2>
                  <Suspense fallback={<CourseProgressSkeleton />}>
                    <ProgressBadge
                      progress={progress}
                      slug={chapter.slug}
                    />
                  </Suspense>
                </div>
                <p>{meta.description}</p>
                <div className="chapter-meta">
                  <span><BookOpen size={13} /> {meta.minutes} min read</span>
                  <span><CheckCircle2 size={13} /> 5-question quiz</span>
                </div>
              </div>
              {accessible ? (
                <Link href={`/course/${chapter.slug}`} className="button-secondary">
                  {index === 0 ? "Start chapter" : "Read chapter"} <ArrowRight size={15} />
                </Link>
              ) : (
                <Link href="/account" className="button-secondary">
                  <Lock size={14} /> Premium
                </Link>
              )}
            </article>
          );
        })}
      </div>
      <Suspense fallback={null}>
        <ViewerNotice billing={billing} />
      </Suspense>
    </div>
  );
}
