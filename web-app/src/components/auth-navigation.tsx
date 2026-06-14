import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SiteNav } from "@/components/site-nav";
import { getOptionalSession } from "@/lib/auth-dal";

export async function AuthenticatedSiteNav() {
  const session = await getOptionalSession().catch(() => null);
  return <SiteNav session={session} />;
}

export async function AuthenticatedMobileNav() {
  const session = await getOptionalSession().catch(() => null);
  return <MobileBottomNav authenticated={Boolean(session)} />;
}
