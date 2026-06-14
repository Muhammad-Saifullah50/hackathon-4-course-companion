import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="protected-empty">
      <BookOpen size={28} className="text-[var(--muted)]" />
      <h1>Page not found</h1>
      <p>The chapter, quiz, or page you requested does not exist.</p>
      <Link href="/course" className="button-primary">Browse the course</Link>
    </div>
  );
}
