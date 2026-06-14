import { NextRequest, NextResponse } from "next/server";

import { getOptionalSession } from "@/lib/auth-dal";
import { searchServerCourse } from "@/lib/authenticated-api";

export async function GET(request: NextRequest) {
  if (!(await getOptionalSession())) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 },
    );
  }
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json(
      { detail: "Query must not be blank" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await searchServerCourse(query));
  } catch {
    return NextResponse.json(
      { detail: "Search is temporarily unavailable." },
      { status: 502 },
    );
  }
}
