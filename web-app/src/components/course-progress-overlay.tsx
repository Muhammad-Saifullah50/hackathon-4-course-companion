import { CheckCircle2 } from "lucide-react";

import type { ProgressResponse } from "@/lib/api-types";

export function CourseProgressOverlay({
  progress,
  slug,
}: {
  progress: ProgressResponse | null;
  slug: string;
}) {
  if (!progress) return null;
  const entry = progress.completions.find((item) => item.chapter_slug === slug);
  if (!entry) return <span className="progress-label">Not completed</span>;
  return (
    <span className="progress-label complete">
      <CheckCircle2 size={13} /> Completed
      {entry.quiz_score !== null ? ` · ${entry.quiz_score}%` : ""}
    </span>
  );
}
