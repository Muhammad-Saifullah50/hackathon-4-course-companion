import { ArrowLeft, ArrowRight, Clock, HelpCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/markdown-content";
import { ReadingProgress } from "@/components/reading-progress";
import { courseMeta } from "@/lib/course-meta";
import { extractToc, readingMinutes } from "@/lib/markdown";
import { ApiError, getChapter, getChapters, getQuiz } from "@/lib/server-api";

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
  try {
    const chapter = await getChapter(slug);
    return { title: `${chapter.title} | Course Companion`, description: courseMeta(slug).description };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return {};
    throw error;
  }
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let chapter;
  try {
    chapter = await getChapter(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const [chapters, quiz] = await Promise.all([getChapters(), getQuiz(slug)]);
  const toc = extractToc(chapter.content);
  const minutes = readingMinutes(chapter.content);
  const index = chapters.findIndex((item) => item.slug === slug);
  const previous = chapters[index - 1];
  const next = chapters[index + 1];

  return (
    <>
      <ReadingProgress />
      <div className="reader-shell">
        <aside className="reader-rail">
          <Link href="/course" className="rail-back"><ArrowLeft size={13} /> All chapters</Link>
          <p className="eyebrow mb-3">Course</p>
          {chapters.map((item) => (
            <Link key={item.slug} href={`/course/${item.slug}`} data-active={item.slug === slug}>
              <span>{item.order}</span>{item.title}
            </Link>
          ))}
        </aside>
        <main className="reader-main">
          <header className="reader-header">
            <p className="eyebrow">Chapter {chapter.order}</p>
            <h1>{chapter.title}</h1>
            <p>{courseMeta(slug).description}</p>
            <div>
              <span><Clock size={13} /> {minutes} min read</span>
              <span><HelpCircle size={13} /> {quiz.questions.length} questions</span>
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
          <nav className="chapter-navigation">
            {previous ? <Link href={`/course/${previous.slug}`}><ArrowLeft size={14} /> {previous.title}</Link> : <span />}
            {next ? <Link href={`/course/${next.slug}`}>{next.title} <ArrowRight size={14} /></Link> : <span />}
          </nav>
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
