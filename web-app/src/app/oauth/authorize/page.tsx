import { Suspense } from "react";

import { OAuthAuthorizeScreen } from "@/components/oauth-authorize-screen";

export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={<main className="p-6">Preparing authorization...</main>}>
      <OAuthAuthorizeScreen />
    </Suspense>
  );
}
