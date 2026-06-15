"use client";

import { IdentityProvider, useStytchSession } from "@stytch/nextjs";

import { BrandedLoader } from "@/components/loading-ui";
import { useAuthPresentation } from "@/hooks/use-auth-presentation";

export function OAuthAuthorizeScreen() {
  const { isInitialized, session } = useStytchSession();
  const presentation = useAuthPresentation();
  if (!isInitialized || !session) {
    return <BrandedLoader label="Preparing secure authorization" />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="surface-card w-full p-5 shadow-xl sm:p-8">
        <IdentityProvider presentation={presentation} />
      </section>
    </main>
  );
}
