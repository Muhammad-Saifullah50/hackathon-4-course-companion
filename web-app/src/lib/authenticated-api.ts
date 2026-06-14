import "server-only";

import type {
  AccessStatus,
  CompletionResponse,
  ProgressResponse,
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
  }
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
      | { detail?: string }
      | null;
    throw new AuthenticatedApiError(
      response.status,
      body?.detail ?? "The request could not be completed.",
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const getServerProfile = () =>
  authenticatedRequest<UserProfile>("/users/me");

export const getServerAccess = () =>
  authenticatedRequest<AccessStatus>("/access/check");

export const getServerProgress = (userId: string) =>
  authenticatedRequest<ProgressResponse>(
    `/users/${encodeURIComponent(userId)}/progress`,
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
