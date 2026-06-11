"use client";

import { IdentityProvider, useStytchSession } from "@stytch/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { currentRelativeUrl, withReturnTo } from "@/lib/auth-navigation";
import { authPresentation } from "@/lib/stytch-config";

export function OAuthAuthorizeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, isInitialized } = useStytchSession();

  useEffect(() => {
    if (isInitialized && !session) {
      const returnTo = currentRelativeUrl(
        pathname,
        new URLSearchParams(searchParams.toString()),
      );
      router.replace(withReturnTo("/login", returnTo));
    }
  }, [isInitialized, pathname, router, searchParams, session]);

  if (!isInitialized || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Preparing secure authorization...
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/50 sm:p-8">
        <IdentityProvider presentation={authPresentation} />
      </section>
    </main>
  );
}
