import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuizRunner } from "@/components/quiz-runner";
import { getOptionalSession } from "@/lib/auth-dal";
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
    return { title: `${chapter.title} Quiz | Course Companion` };
  } catch {
    return {};
  }
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const [chapter, quiz, session] = await Promise.all([
      getChapter(slug),
      getQuiz(slug),
      getOptionalSession(),
    ]);
    return (
      <div className="mx-auto max-w-[680px] px-5 py-12">
        <QuizRunner
          authenticated={Boolean(session)}
          quiz={quiz}
          title={chapter.title}
          order={chapter.order}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
