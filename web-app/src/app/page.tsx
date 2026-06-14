import { LandingPage } from "@/components/landing-page";
import { getChapters } from "@/lib/server-api";

export default async function HomePage() {
  const chapters = await getChapters();
  return <LandingPage chapters={chapters} />;
}
