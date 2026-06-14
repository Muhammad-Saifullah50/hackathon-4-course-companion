"use client";

import { IdentityProvider, useStytchSession } from "@stytch/nextjs";

import { BrandedLoader } from "@/components/loading-ui";
import { authPresentation } from "@/lib/stytch-config";

export function OAuthAuthorizeScreen() {
  const { isInitialized, session } = useStytchSession();
  if (!isInitialized || !session) {
    return <BrandedLoader label="Preparing secure authorization" />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/50 sm:p-8">
        <IdentityProvider presentation={authPresentation} />
      </section>
    </main>
  );
}
