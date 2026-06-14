import { ProgressScreen } from "@/components/progress-screen";
import { verifySession } from "@/lib/auth-dal";
import { getServerProgress } from "@/lib/authenticated-api";
import { getChapters } from "@/lib/server-api";

export default async function ProgressPage() {
  const session = await verifySession();
  const [chapters, progress] = await Promise.all([
    getChapters(),
    getServerProgress(session.user_id),
  ]);
  return <ProgressScreen chapters={chapters} progress={progress} />;
}
