import { DashboardExperience } from "@/components/dashboard-experience";
import { verifySession } from "@/lib/auth-dal";
import {
  getServerProfile,
  getServerProgress,
} from "@/lib/authenticated-api";
import { getChapters } from "@/lib/server-api";

export default async function DashboardPage() {
  const session = await verifySession();
  const [chapters, profile, progress] = await Promise.all([
    getChapters(),
    getServerProfile(),
    getServerProgress(session.user_id),
  ]);
  return (
    <DashboardExperience
      chapters={chapters}
      profile={profile}
      progress={progress}
    />
  );
}
