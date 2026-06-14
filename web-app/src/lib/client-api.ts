"use client";

import type {
  GradedResult,
} from "@/lib/api-types";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function submitAnswer(
  slug: string,
  questionId: string,
  selectedAnswer: string,
): Promise<GradedResult> {
  const response = await fetch(
    `${backendUrl}/quizzes/${encodeURIComponent(slug)}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: questionId,
        selected_answer: selectedAnswer,
      }),
    },
  );
  if (!response.ok) {
    throw new ClientApiError(response.status, "Could not grade this answer.");
  }
  return (await response.json()) as GradedResult;
}
