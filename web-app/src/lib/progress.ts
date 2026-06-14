import type { ChapterSummary, ProgressResponse } from "@/lib/api-types";

export function completionMap(progress: ProgressResponse | null) {
  return new Map(
    (progress?.completions ?? []).map((entry) => [entry.chapter_slug, entry]),
  );
}

export function progressPercent(
  chapters: ChapterSummary[],
  progress: ProgressResponse | null,
) {
  if (chapters.length === 0) return 0;
  return Math.round(
    (completionMap(progress).size / chapters.length) * 100,
  );
}
