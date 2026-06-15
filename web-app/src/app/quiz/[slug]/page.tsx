import type { Metadata } from "next";
import { Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuizRunner } from "@/components/quiz-runner";
import { getOptionalSession } from "@/lib/auth-dal";
import {
  getServerBillingStatus,
  getServerChapter,
  getServerChapters,
  getServerQuiz,
} from "@/lib/authenticated-api";
import { getChapters, getChapter, getQuiz } from "@/lib/server-api";

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
  return chapter ? { title: `${chapter.title} Quiz | Claude Teacher` } : {};
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getOptionalSession();
  const chapters = session ? await getServerChapters() : await getChapters();
  const summary = chapters.find((item) => item.slug === slug);
  if (!summary) notFound();
  if (summary.accessible === false) {
    return (
      <main className="protected-empty">
        <Lock size={28} />
        <h1>Premium quiz</h1>
        <p>Upgrade to take the quiz for {summary.title}.</p>
        <Link href="/account" className="button-primary">View Premium</Link>
      </main>
    );
  }
  const [chapter, quiz, billing] = await Promise.all([
    session ? getServerChapter(slug) : getChapter(slug),
    session ? getServerQuiz(slug) : getQuiz(slug),
    session ? getServerBillingStatus() : null,
  ]);
  const paid = Boolean(billing && billing.tier !== "free");
  return (
    <div className="mx-auto max-w-[680px] px-5 py-12">
      <QuizRunner
        authentication={Promise.resolve(Boolean(session))}
        progressEligible={paid}
        quiz={quiz}
        title={chapter.title}
        order={chapter.order}
      />
    </div>
  );
}
