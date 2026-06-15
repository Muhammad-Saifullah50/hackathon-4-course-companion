import { cacheLife, cacheTag } from "next/cache";

import type {
  ChapterDetail,
  ChapterSummary,
  PlanCatalogItem,
  QuizPublic,
} from "@/lib/api-types";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function publicRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null;
    throw new ApiError(
      response.status,
      body?.detail ?? "Course data is temporarily unavailable.",
    );
  }
  return (await response.json()) as T;
}

export async function getChapters(): Promise<ChapterSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("chapters");
  return publicRequest<ChapterSummary[]>("/chapters");
}

export async function getChapter(slug: string): Promise<ChapterDetail> {
  "use cache";
  cacheLife("minutes");
  cacheTag("chapters", `chapter:${slug}`);
  return publicRequest<ChapterDetail>(`/chapters/${encodeURIComponent(slug)}`);
}

export async function getQuiz(slug: string): Promise<QuizPublic> {
  "use cache";
  cacheLife("minutes");
  cacheTag("quizzes", `quiz:${slug}`);
  return publicRequest<QuizPublic>(`/quizzes/${encodeURIComponent(slug)}`);
}

export async function getPlans(): Promise<PlanCatalogItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("billing-plans");
  return publicRequest<PlanCatalogItem[]>("/billing/plans");
}
