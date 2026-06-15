import "server-only";

import type {
  AccessStatus,
  BillingSession,
  BillingStatus,
  ChapterDetail,
  ChapterSummary,
  CompletionResponse,
  GradedResult,
  ProgressResponse,
  QuizPublic,
  SearchResponse,
  UserProfile,
} from "@/lib/api-types";
import { getServerSessionToken } from "@/lib/auth-dal";

const backendUrl =
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export class AuthenticatedApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthenticatedApiError";
  }
}

function errorMessage(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return "The request could not be completed.";
  }

  const value = detail as Record<string, unknown>;
  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }
  if (value.code === "upgrade_required") {
    const resource =
      typeof value.resource === "string" && value.resource
        ? value.resource.replaceAll("_", " ")
        : "This feature";
    const tier =
      typeof value.required_tier === "string" && value.required_tier
        ? value.required_tier
        : "premium";
    return `${resource.charAt(0).toUpperCase()}${resource.slice(1)} requires ${tier} access.`;
  }
  return "The request could not be completed.";
}

async function authenticatedRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getServerSessionToken();
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Stytch-Session": token,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { detail?: unknown }
      | null;
    throw new AuthenticatedApiError(
      response.status,
      errorMessage(body?.detail),
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const getServerProfile = () =>
  authenticatedRequest<UserProfile>("/users/me");

export const getServerAccess = () =>
  authenticatedRequest<AccessStatus>("/access/check");

export const getServerBillingStatus = () =>
  authenticatedRequest<BillingStatus>("/billing/status");

export const createServerCheckout = () =>
  authenticatedRequest<BillingSession>("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan: "premium" }),
  });

export const createServerBillingPortal = () =>
  authenticatedRequest<BillingSession>("/billing/portal", {
    method: "POST",
  });

export const getServerProgress = (userId: string) =>
  authenticatedRequest<ProgressResponse>(
    `/users/${encodeURIComponent(userId)}/progress`,
  );

export const getServerChapters = () =>
  authenticatedRequest<ChapterSummary[]>("/chapters");

export const getServerChapter = (slug: string) =>
  authenticatedRequest<ChapterDetail>(
    `/chapters/${encodeURIComponent(slug)}`,
  );

export const getServerQuiz = (slug: string) =>
  authenticatedRequest<QuizPublic>(`/quizzes/${encodeURIComponent(slug)}`);

export const gradeServerAnswer = (
  slug: string,
  questionId: string,
  selectedAnswer: string,
) =>
  authenticatedRequest<GradedResult>(
    `/quizzes/${encodeURIComponent(slug)}/submit`,
    {
      method: "POST",
      body: JSON.stringify({
        question_id: questionId,
        selected_answer: selectedAnswer,
      }),
    },
  );

export const searchServerCourse = (query: string) =>
  authenticatedRequest<SearchResponse>(
    `/search?q=${encodeURIComponent(query)}`,
  );

export const saveServerCompletion = (
  userId: string,
  slug: string,
  score: number,
) =>
  authenticatedRequest<CompletionResponse>(
    `/users/${encodeURIComponent(userId)}/progress?chapter_slug=${encodeURIComponent(slug)}`,
    {
      method: "PUT",
      body: JSON.stringify({ quiz_score: score }),
    },
  );
