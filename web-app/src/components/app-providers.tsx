"use client";

import { createStytchClient, StytchProvider } from "@stytch/nextjs";

const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
const stytch = publicToken ? createStytchClient(publicToken) : null;

export function AppProviders({ children }: { children: React.ReactNode }) {
  if (!stytch) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h1 className="font-semibold">Authentication is not configured</h1>
          <p className="mt-2 text-sm leading-6">
            Set <code>NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN</code> for this deployment.
          </p>
        </div>
      </main>
    );
  }

  return <StytchProvider stytch={stytch}>{children}</StytchProvider>;
}
