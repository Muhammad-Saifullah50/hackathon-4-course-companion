import { Suspense } from "react";

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
import { getServerProgress } from "@/lib/authenticated-api";
import { getChapters } from "@/lib/server-api";

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

export default function ProgressPage() {
  const session = verifySession();
  const chapters = getChapters();
  const progress = session.then(({ user_id }) => getServerProgress(user_id));

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
