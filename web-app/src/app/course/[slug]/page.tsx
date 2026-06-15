import { ArrowLeft, ArrowRight, Clock, HelpCircle, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReaderRailSkeleton, Skeleton } from "@/components/loading-ui";
import { MarkdownContent } from "@/components/markdown-content";
import { ReadingProgress } from "@/components/reading-progress";
import type {
  ChapterSummary,
  QuizPublic,
} from "@/lib/api-types";
import { courseMeta } from "@/lib/course-meta";
import { extractToc, readingMinutes } from "@/lib/markdown";
import { getOptionalSession } from "@/lib/auth-dal";
import {
  getServerChapter,
  getServerChapters,
  getServerQuiz,
} from "@/lib/authenticated-api";
import { getChapter, getChapters, getQuiz } from "@/lib/server-api";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      cookies: [{ name: "stytch_session", value: null }],
      params: { slug: "claude-agent-sdk-foundations" },
    },
  ],
};

export async function generateStaticParams() {
  const chapters = await getChapters();
  return chapters.map((chapter) => ({ slug: chapter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const chapter = (await getChapters()).find((item) => item.slug === slug);
  return chapter
    ? {
        title: `${chapter.title} | Claude Teacher`,
        description: courseMeta(slug).description,
      }
    : {};
}

async function ChapterRail({
  chapters,
  slug,
}: {
  chapters: Promise<ChapterSummary[]>;
  slug: string;
}) {
  return (
    <>
      <Link href="/course" className="rail-back">
        <ArrowLeft size={13} /> All chapters
      </Link>
      <p className="eyebrow mb-3">Course</p>
      {(await chapters).map((item) => (
        <Link
          key={item.slug}
          href={item.accessible === false ? "/account" : `/course/${item.slug}`}
          data-active={item.slug === slug}
        >
          <span>{item.order}</span>
          {item.title}
          {item.accessible === false ? <Lock size={12} /> : null}
        </Link>
      ))}
    </>
  );
}

async function QuizQuestionCount({
  quiz,
}: {
  quiz: Promise<QuizPublic>;
}) {
  return (
    <span>
      <HelpCircle size={13} /> {(await quiz).questions.length} questions
    </span>
  );
}

async function ChapterNavigation({
  chapters,
  slug,
}: {
  chapters: Promise<ChapterSummary[]>;
  slug: string;
}) {
  const value = await chapters;
  const index = value.findIndex((item) => item.slug === slug);
  const previous = value[index - 1];
  const next = value[index + 1];

  return (
    <nav className="chapter-navigation">
      {previous ? (
        <Link href={`/course/${previous.slug}`}>
          <ArrowLeft size={14} /> {previous.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.accessible === false ? "/account" : `/course/${next.slug}`}>
          {next.accessible === false ? <Lock size={13} /> : null}
          {next.title} <ArrowRight size={14} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getOptionalSession();
  const chapters = session ? getServerChapters() : getChapters();
  const chapterList = await chapters;
  const summary = chapterList.find((item) => item.slug === slug);
  if (!summary) notFound();
  if (summary.accessible === false) {
    return <LockedChapter title={summary.title} order={summary.order} />;
  }
  const chapter = session
    ? await getServerChapter(slug)
    : await getChapter(slug);
  const quiz = session ? getServerQuiz(slug) : getQuiz(slug);
  const toc = extractToc(chapter.content);
  const minutes = readingMinutes(chapter.content);

  return (
    <>
      <ReadingProgress />
      <div className="reader-shell">
        <aside className="reader-rail">
          <Suspense fallback={<ReaderRailSkeleton />}>
            <ChapterRail chapters={chapters} slug={slug} />
          </Suspense>
        </aside>
        <main className="reader-main">
          <header className="reader-header">
            <p className="eyebrow">Chapter {chapter.order}</p>
            <h1>{chapter.title}</h1>
            <p>{courseMeta(slug).description}</p>
            <div>
              <span><Clock size={13} /> {minutes} min read</span>
              <Suspense fallback={<Skeleton className="h-4 w-24" />}>
                <QuizQuestionCount quiz={quiz} />
              </Suspense>
            </div>
          </header>
          <MarkdownContent content={chapter.content} />
          <section className="quiz-cta surface-card">
            <div>
              <p className="eyebrow mb-2">Check your understanding</p>
              <h2>Ready for the chapter quiz?</h2>
              <p className="muted mt-1">Get instant feedback and save your score after all questions.</p>
            </div>
            <Link href={`/quiz/${slug}`} className="button-primary">Take quiz <ArrowRight size={15} /></Link>
          </section>
          <Suspense
            fallback={
              <nav className="chapter-navigation">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-32" />
              </nav>
            }
          >
            <ChapterNavigation chapters={chapters} slug={slug} />
          </Suspense>
        </main>
        <aside className="toc">
          <p className="eyebrow mb-3">On this page</p>
          {toc.filter((item) => item.level === 2).map((item) => (
            <a key={item.id} href={`#${item.id}`}>{item.text}</a>
          ))}
        </aside>
      </div>
    </>
  );
}

function LockedChapter({ title, order }: { title: string; order: number }) {
  return (
    <main className="protected-empty">
      <Lock size={28} />
      <p className="eyebrow">Chapter {order}</p>
      <h1>{title}</h1>
      <p>
        This chapter and its quiz are included with Premium, along with saved
        progress and the complete course.
      </p>
      <Link href="/account" className="button-primary">
        View Premium
      </Link>
      <Link href="/course" className="button-secondary">
        Back to course
      </Link>
    </main>
  );
}
