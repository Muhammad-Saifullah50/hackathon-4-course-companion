"use client";

import { createStytchClient, StytchProvider } from "@stytch/nextjs";

const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
const stytch = publicToken
  ? createStytchClient(publicToken, {
      cookieOptions: { path: "/" },
    })
  : null;

export function AppProviders({ children }: { children: React.ReactNode }) {
  return stytch ? (
    <StytchProvider stytch={stytch}>{children}</StytchProvider>
  ) : (
    children
  );
}
