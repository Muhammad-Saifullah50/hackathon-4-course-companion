"use client";

import { StytchPasswordReset, useStytchSession } from "@stytch/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { AuthShell } from "@/components/auth-shell";
import { useAuthPresentation } from "@/hooks/use-auth-presentation";
import { readReturnTo } from "@/lib/auth-navigation";
import { buildLoginConfig } from "@/lib/stytch-config";

export function PasswordResetScreen() {
  const router = useRouter();
  const { session, isInitialized } = useStytchSession();
  const presentation = useAuthPresentation();
  const origin =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      : window.location.origin;
  const config = useMemo(
    () => buildLoginConfig(origin),
    [origin],
  );

  useEffect(() => {
    if (isInitialized && session) {
      router.replace(readReturnTo());
    }
  }, [isInitialized, router, session]);

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password."
      description="After your password is reset, you will return to the page that started the authentication flow."
    >
      <StytchPasswordReset config={config} presentation={presentation} />
    </AuthShell>
  );
}
