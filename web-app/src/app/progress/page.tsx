import { Suspense } from "react";
import { Lock } from "lucide-react";
import Link from "next/link";

import {
  ProgressBreakdown,
  ProgressStats,
  ProgressTimezoneNote,
} from "@/components/progress-screen";
import {
  ProgressBreakdownSkeleton,
  ProgressStatsSkeleton,
} from "@/components/loading-ui";
import type { ChapterSummary, ProgressResponse } from "@/lib/api-types";
import { verifySession } from "@/lib/auth-dal";
import {
  getServerBillingStatus,
  getServerChapters,
  getServerProgress,
} from "@/lib/authenticated-api";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      cookies: [{ name: "stytch_session", value: null }],
    },
  ],
};

async function Stats({
  chapters,
  progress,
}: {
  chapters: Promise<ChapterSummary[]>;
  progress: Promise<ProgressResponse>;
}) {
  return <ProgressStats chapters={await chapters} progress={await progress} />;
}

async function Breakdown({
  chapters,
  progress,
}: {
  chapters: Promise<ChapterSummary[]>;
  progress: Promise<ProgressResponse>;
}) {
  return (
    <ProgressBreakdown
      chapters={await chapters}
      progress={await progress}
    />
  );
}

export default async function ProgressPage() {
  const [session, billing] = await Promise.all([
    verifySession(),
    getServerBillingStatus(),
  ]);
  if (billing.tier === "free") {
    return (
      <main className="protected-empty">
        <Lock size={28} />
        <p className="eyebrow">Premium feature</p>
        <h1>Save your learning progress</h1>
        <p>
          Premium includes chapter completion, quiz scores, and learning
          streaks across the full course.
        </p>
        <Link href="/account" className="button-primary">
          View Premium
        </Link>
      </main>
    );
  }
  const chapters = getServerChapters();
  const progress = getServerProgress(session.user_id);

  return (
    <div className="page-shell">
      <p className="eyebrow mb-2">Progress</p>
      <h1 className="text-2xl font-semibold">Your learning journey</h1>
      <Suspense fallback={<ProgressStatsSkeleton />}>
        <Stats chapters={chapters} progress={progress} />
      </Suspense>
      <Suspense fallback={<ProgressBreakdownSkeleton />}>
        <Breakdown chapters={chapters} progress={progress} />
      </Suspense>
      <ProgressTimezoneNote />
    </div>
  );
}
