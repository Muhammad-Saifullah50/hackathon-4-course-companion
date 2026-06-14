import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CourseProgressOverlay } from "@/components/course-progress-overlay";
import { getOptionalSession } from "@/lib/auth-dal";
import { getServerProgress } from "@/lib/authenticated-api";
import { courseMeta } from "@/lib/course-meta";
import { getChapters } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Course | Course Companion",
  description: "Five focused chapters on building reliable AI agents.",
};

export default async function CoursePage() {
  const [chapters, session] = await Promise.all([
    getChapters(),
    getOptionalSession(),
  ]);
  const progress = session
    ? await getServerProgress(session.user_id)
    : null;
  return (
    <div className="page-shell">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow mb-2">AI Agent Development</p>
        <h1 className="text-3xl font-semibold tracking-tight">Course chapters</h1>
        <p className="muted mt-3 leading-7">
          Move from the Claude Agent SDK foundations through MCP servers and
          reusable agent skills. Every chapter and quiz is free to access.
        </p>
      </header>
      <div className="course-list">
        {chapters.map((chapter, index) => {
          const meta = courseMeta(chapter.slug);
          return (
            <article className="course-card" key={chapter.slug}>
              <div className="chapter-number">{chapter.order}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2>{chapter.title}</h2>
                  <Suspense>
                    <CourseProgressOverlay
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
              <Link href={`/course/${chapter.slug}`} className="button-secondary">
                {index === 0 ? "Start chapter" : "Read chapter"} <ArrowRight size={15} />
              </Link>
            </article>
          );
        })}
      </div>
      {!session && (
        <aside className="save-notice">
          Sign in to save chapter completion, quiz scores, and your UTC learning streak.
          <Link href="/signup"> Create a free account</Link>
        </aside>
      )}
    </div>
  );
}
