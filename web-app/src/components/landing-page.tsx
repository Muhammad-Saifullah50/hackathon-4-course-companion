import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Network,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { NodeGraphic } from "@/components/node-graphic";
import type { ChapterSummary } from "@/lib/api-types";
import { courseMeta } from "@/lib/course-meta";

export function LandingPage({ chapters }: { chapters: ChapterSummary[] }) {
  const values = [
    [
      Network,
      "Agent architecture",
      "Understand reasoning loops and reliable tool use.",
    ],
    [
      Zap,
      "Advanced patterns",
      "Learn orchestration, streaming, caching, and recovery.",
    ],
    [
      Code2,
      "MCP protocol",
      "Connect agents to external tools and data consistently.",
    ],
    [
      ShieldCheck,
      "Production skills",
      "Package focused, reusable agent behavior.",
    ],
  ] as const;
  return (
    <div>
      <section className="hero">
        <div>
          <span className="hero-badge">5 chapters · 25 quiz questions</span>
          <h1>
            Learn to build reliable <span>AI agents</span> with Claude
          </h1>
          <p>
            A focused course on the Claude Agent SDK and Model Context Protocol,
            from foundations to production-ready systems.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/course" className="button-primary">
              Start course <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="button-secondary">
              Sign in
            </Link>
          </div>
          <small>
            Sign in to save progress, scores, and your learning streak.
          </small>
        </div>
        <NodeGraphic />
      </section>
      <section className="landing-section bg-[var(--surface)]">
        <p className="eyebrow mb-8">What you&apos;ll learn</p>
        <div className="value-grid">
          {values.map(([Icon, title, body]) => (
            <article className="surface-card" key={title}>
              <span>
                <Icon size={18} />
              </span>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-section">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">Course chapters</p>
            <h2 className="text-2xl font-semibold">
              Five chapters, zero fluff
            </h2>
          </div>
          <Link href="/course" className="text-sm text-[var(--emerald)]">
            View all →
          </Link>
        </div>
        <div className="grid gap-3">
          {chapters.map((chapter) => (
            <Link
              href={`/course/${chapter.slug}`}
              className="chapter-preview"
              key={chapter.slug}
            >
              <span>{chapter.order}</span>
              <div>
                <strong>{chapter.title}</strong>
                <small>
                  {courseMeta(chapter.slug).minutes} min read · 5 questions
                </small>
              </div>
              <ArrowRight size={15} />
            </Link>
          ))}
        </div>
      </section>
      <section className="landing-section bg-[var(--surface)] text-center">
        <BookOpen size={25} className="mx-auto mb-4 text-[var(--emerald)]" />
        <h2 className="text-2xl font-semibold">Save your progress</h2>
        <p className="muted mx-auto mt-3 max-w-xl">
          One free account keeps completion, quiz scores, and streaks in sync
          across the web and Course Companion inside ChatGPT.
        </p>
        <Link href="/signup" className="button-primary mt-6">
          Create free account
        </Link>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs text-[var(--muted)]">
          {[
            "Completion saved",
            "Scores and streaks",
            "Works inside ChatGPT",
          ].map((item) => (
            <span className="flex items-center gap-1" key={item}>
              <CheckCircle2 size={13} className="text-[var(--emerald)]" />
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
