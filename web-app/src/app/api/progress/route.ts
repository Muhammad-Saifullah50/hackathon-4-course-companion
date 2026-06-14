import { NextRequest, NextResponse } from "next/server";

import { getOptionalSession } from "@/lib/auth-dal";
import { saveServerCompletion } from "@/lib/authenticated-api";

interface SaveProgressBody {
  chapter_slug?: unknown;
  quiz_score?: unknown;
}

function parseProgressBody(body: SaveProgressBody): {
  chapterSlug: string;
  quizScore: number;
} | null {
  if (
    typeof body.chapter_slug !== "string" ||
    typeof body.quiz_score !== "number" ||
    body.quiz_score < 0 ||
    body.quiz_score > 100
  ) {
    return null;
  }
  return {
    chapterSlug: body.chapter_slug,
    quizScore: body.quiz_score,
  };
}

export async function PUT(request: NextRequest) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 },
    );
  }
  const body = (await request.json()) as SaveProgressBody;
  const parsed = parseProgressBody(body);
  if (!parsed) {
    return NextResponse.json(
      { detail: "Invalid progress payload" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await saveServerCompletion(
        session.user_id,
        parsed.chapterSlug,
        parsed.quizScore,
      ),
    );
  } catch {
    return NextResponse.json(
      { detail: "Your score could not be saved." },
      { status: 502 },
    );
  }
}
