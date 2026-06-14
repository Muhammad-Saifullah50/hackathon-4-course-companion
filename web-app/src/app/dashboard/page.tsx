import { Suspense } from "react";

import {
  DashboardGreeting,
  DashboardLearning,
  DashboardProgressSummary,
  DashboardSearchShortcut,
  DashboardStats,
} from "@/components/dashboard-experience";
import {
  DashboardGreetingSkeleton,
  DashboardLearningSkeleton,
  DashboardStatsSkeleton,
  Skeleton,
} from "@/components/loading-ui";
import type {
  ChapterSummary,
  ProgressResponse,
  UserProfile,
} from "@/lib/api-types";
import { verifySession } from "@/lib/auth-dal";
import {
  getServerProfile,
  getServerProgress,
} from "@/lib/authenticated-api";
import { getChapters } from "@/lib/server-api";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      cookies: [{ name: "stytch_session", value: null }],
    },
  ],
};

async function Greeting({
  profile,
}: {
  profile: Promise<UserProfile>;
}) {
  return <DashboardGreeting profile={await profile} />;
}

async function ProgressSummary({
  chapters,
  progress,
}: {
  chapters: Promise<ChapterSummary[]>;
  progress: Promise<ProgressResponse>;
}) {
  return (
    <DashboardProgressSummary
      chapters={await chapters}
      progress={await progress}
    />
  );
}

async function LearningPath({
  chapters,
  progress,
}: {
  chapters: Promise<ChapterSummary[]>;
  progress: Promise<ProgressResponse>;
}) {
  return (
    <DashboardLearning
      chapters={await chapters}
      progress={await progress}
    />
  );
}

async function Stats({
  chapters,
  progress,
}: {
  chapters: Promise<ChapterSummary[]>;
  progress: Promise<ProgressResponse>;
}) {
  return (
    <DashboardStats chapters={await chapters} progress={await progress} />
  );
}

export default function DashboardPage() {
  const session = verifySession();
  const chapters = getChapters();
  const profile = getServerProfile();
  const progress = session.then(({ user_id }) => getServerProgress(user_id));

  return (
    <div className="page-shell">
      <header className="mb-10">
        <Suspense fallback={<DashboardGreetingSkeleton />}>
          <Greeting profile={profile} />
        </Suspense>
        <Suspense
          fallback={<Skeleton className="mt-3 h-4 w-80 max-w-full" />}
        >
          <ProgressSummary chapters={chapters} progress={progress} />
        </Suspense>
      </header>
      <div className="dashboard-grid">
        <Suspense fallback={<DashboardLearningSkeleton />}>
          <LearningPath chapters={chapters} progress={progress} />
        </Suspense>
        <aside className="grid content-start gap-4">
          <Suspense fallback={<DashboardStatsSkeleton />}>
            <Stats chapters={chapters} progress={progress} />
          </Suspense>
          <DashboardSearchShortcut />
        </aside>
      </div>
    </div>
  );
}
