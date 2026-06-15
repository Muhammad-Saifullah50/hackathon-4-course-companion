import { NextRequest, NextResponse } from "next/server";

import { getOptionalSession } from "@/lib/auth-dal";
import { gradeServerAnswer } from "@/lib/authenticated-api";

interface QuizAnswerBody {
  chapter_slug?: unknown;
  question_id?: unknown;
  selected_answer?: unknown;
}

const backendUrl =
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as QuizAnswerBody;
  if (
    typeof body.chapter_slug !== "string" ||
    typeof body.question_id !== "string" ||
    typeof body.selected_answer !== "string"
  ) {
    return NextResponse.json({ detail: "Invalid quiz answer" }, { status: 400 });
  }

  try {
    const result = (await getOptionalSession())
      ? await gradeServerAnswer(
          body.chapter_slug,
          body.question_id,
          body.selected_answer,
        )
      : await gradePublicAnswer(
          body.chapter_slug,
          body.question_id,
          body.selected_answer,
        );
    return NextResponse.json(result);
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 502;
    return NextResponse.json(
      { detail: status === 403 ? "Premium required" : "Answer grading failed" },
      { status },
    );
  }
}

async function gradePublicAnswer(
  chapterSlug: string,
  questionId: string,
  selectedAnswer: string,
) {
  const response = await fetch(
    `${backendUrl}/quizzes/${encodeURIComponent(chapterSlug)}/submit`,
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
    throw { status: response.status };
  }
  return response.json();
}
