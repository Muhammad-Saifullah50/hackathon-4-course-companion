import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AuthSession,
  ChapterSummary,
  ProgressResponse,
  UserProfile,
} from "@/lib/api-types";

const mocks = vi.hoisted(() => ({
  getChapters: vi.fn(),
  getOptionalSession: vi.fn(),
  getServerBillingStatus: vi.fn(),
  getServerChapters: vi.fn(),
  getServerProfile: vi.fn(),
  getServerProgress: vi.fn(),
  verifySession: vi.fn(),
}));

vi.mock("@/lib/auth-dal", () => ({
  getOptionalSession: mocks.getOptionalSession,
  verifySession: mocks.verifySession,
}));

vi.mock("@/lib/authenticated-api", () => ({
  getServerBillingStatus: mocks.getServerBillingStatus,
  getServerChapters: mocks.getServerChapters,
  getServerProfile: mocks.getServerProfile,
  getServerProgress: mocks.getServerProgress,
}));

vi.mock("@/lib/server-api", () => ({
  getChapters: mocks.getChapters,
}));

import CoursePage from "@/app/course/page";
import DashboardPage from "@/app/dashboard/page";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function readStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const first = await reader.read();
  let html = first.value ? decoder.decode(first.value) : "";

  return {
    first: html,
    finish: async () => {
      while (true) {
        const result = await reader.read();
        if (result.done) return html;
        html += decoder.decode(result.value);
      }
    },
  };
}

const chapters: ChapterSummary[] = [
  { slug: "intro", title: "Agent Foundations", order: 1 },
];

const session: AuthSession = {
  user_id: "user-1",
  email: "learner@example.com",
  expires_at: null,
};

const profile: UserProfile = {
  id: "user-1",
  email: "learner@example.com",
  access_tier: "free",
  created_at: "2026-06-01T00:00:00Z",
};

const progress: ProgressResponse = {
  user_id: "user-1",
  completions: [],
  current_streak: 0,
  last_active_date: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getServerBillingStatus.mockResolvedValue({
    tier: "premium",
    subscription_status: "active",
    current_period_end: null,
    cancel_at_period_end: false,
  });
  mocks.getServerChapters.mockResolvedValue(chapters);
});

describe("streamed pages", () => {
  it("streams the dashboard shell without waiting for profile or progress", async () => {
    const pendingProfile = deferred<UserProfile>();
    const pendingProgress = deferred<ProgressResponse>();

    mocks.verifySession.mockReturnValue(Promise.resolve(session));
    mocks.getServerProfile.mockReturnValue(pendingProfile.promise);
    mocks.getServerProgress.mockReturnValue(pendingProgress.promise);

    const streamed = await readStream(
      await renderToReadableStream(DashboardPage()),
    );

    expect(streamed.first).toContain('href="/search"');
    expect(streamed.first).toContain("Loading learning path");
    expect(streamed.first).not.toContain("Welcome back");

    pendingProfile.resolve(profile);
    pendingProgress.resolve(progress);
    expect(await streamed.finish()).toContain("Welcome back");
  });

  it("renders the Free dashboard without requesting premium progress", async () => {
    mocks.verifySession.mockReturnValue(Promise.resolve(session));
    mocks.getServerProfile.mockReturnValue(Promise.resolve(profile));
    mocks.getServerBillingStatus.mockResolvedValue({
      tier: "free",
      subscription_status: null,
      current_period_end: null,
      cancel_at_period_end: false,
    });

    const streamed = await readStream(
      await renderToReadableStream(DashboardPage()),
    );
    const html = await streamed.finish();

    expect(html).toContain("Premium progress");
    expect(html).toContain("Upgrade Now");
    expect(mocks.getServerProgress).not.toHaveBeenCalled();
  });

  it("uses authenticated chapter access on the Premium dashboard", async () => {
    const premiumChapters: ChapterSummary[] = [
      {
        slug: "advanced",
        title: "Advanced Agents",
        order: 4,
        accessible: true,
      },
    ];

    mocks.verifySession.mockReturnValue(Promise.resolve(session));
    mocks.getServerChapters.mockResolvedValue(premiumChapters);
    mocks.getServerProfile.mockResolvedValue(profile);
    mocks.getServerProgress.mockResolvedValue(progress);

    const streamed = await readStream(
      await renderToReadableStream(DashboardPage()),
    );
    const html = await streamed.finish();

    expect(html).toContain('href="/course/advanced"');
    expect(html).not.toContain('href="/account"');
    expect(mocks.getServerChapters).toHaveBeenCalledOnce();
    expect(mocks.getChapters).not.toHaveBeenCalled();
  });

  it("streams the course shell while entitlement resolution is pending", async () => {
    const pendingSession = deferred<AuthSession | null>();

    mocks.getOptionalSession.mockReturnValue(pendingSession.promise);
    mocks.getChapters.mockReturnValue(Promise.resolve(chapters));

    const page = CoursePage();
    pendingSession.resolve(null);
    const streamed = await readStream(await renderToReadableStream(await page));

    expect(streamed.first).toContain("Agent Foundations");
    expect(mocks.getServerProgress).not.toHaveBeenCalled();

    expect(await streamed.finish()).toContain("Create a free account");
  });
});
