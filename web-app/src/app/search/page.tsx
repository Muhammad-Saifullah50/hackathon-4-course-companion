import { Suspense } from "react";

import { SearchScreen } from "@/components/search-screen";
import { SearchSkeleton } from "@/components/loading-ui";
import type { ChapterSummary } from "@/lib/api-types";
import { verifySession } from "@/lib/auth-dal";
import { getServerChapters } from "@/lib/authenticated-api";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      cookies: [{ name: "stytch_session", value: null }],
    },
  ],
};

async function SearchContent({
  authentication,
  chapters,
}: {
  authentication: ReturnType<typeof verifySession>;
  chapters: Promise<ChapterSummary[]>;
}) {
  await authentication;
  return <SearchScreen chapters={await chapters} />;
}

export default function SearchPage() {
  const authentication = verifySession();
  const chapters = getServerChapters();

  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent authentication={authentication} chapters={chapters} />
    </Suspense>
  );
}
