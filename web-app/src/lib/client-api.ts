"use client";

import type {
  GradedResult,
} from "@/lib/api-types";

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
    "/api/quiz",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapter_slug: slug,
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
