import { Suspense } from "react";

import { BrandedLoader } from "@/components/loading-ui";
import { OAuthAuthorizeScreen } from "@/components/oauth-authorize-screen";
import { verifySession } from "@/lib/auth-dal";

export default async function OAuthAuthorizePage() {
  await verifySession();
  return (
    <Suspense fallback={<BrandedLoader label="Preparing authorization" />}>
      <OAuthAuthorizeScreen />
    </Suspense>
  );
}
