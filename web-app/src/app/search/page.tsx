import { SearchScreen } from "@/components/search-screen";
import { verifySession } from "@/lib/auth-dal";
import { getChapters } from "@/lib/server-api";

export default async function SearchPage() {
  await verifySession();
  return <SearchScreen chapters={await getChapters()} />;
}
