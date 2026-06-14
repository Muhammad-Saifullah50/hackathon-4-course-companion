import { describe, expect, it } from "vitest";

import type { ChapterSummary, ProgressResponse } from "./api-types";
import { progressPercent } from "./progress";

describe("progressPercent", () => {
  it("uses completed chapters over total chapters", () => {
    const chapters: ChapterSummary[] = [
      { slug: "one", title: "One", order: 1 },
      { slug: "two", title: "Two", order: 2 },
    ];
    const progress: ProgressResponse = {
      user_id: "user",
      current_streak: 1,
      last_active_date: "2026-06-13",
      completions: [
        {
          chapter_slug: "one",
          completed_at: "2026-06-13T00:00:00Z",
          quiz_score: 80,
        },
      ],
    };

    expect(progressPercent(chapters, progress)).toBe(50);
  });
});
