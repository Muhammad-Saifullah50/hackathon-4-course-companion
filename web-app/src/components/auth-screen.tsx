"use client";

import { StytchLogin, useStytchSession } from "@stytch/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { AuthShell } from "@/components/auth-shell";
import { useAuthPresentation } from "@/hooks/use-auth-presentation";
import { safeReturnTo, storeReturnTo } from "@/lib/auth-navigation";
import { buildLoginConfig } from "@/lib/stytch-config";

export function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isInitialized } = useStytchSession();
  const returnTo = safeReturnTo(searchParams.get("return_to"));
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
    storeReturnTo(returnTo);
    if (isInitialized && session) {
      router.replace(returnTo);
    }
  }, [isInitialized, returnTo, router, session]);

  return (
    <AuthShell
      eyebrow={mode === "signup" ? "Create your account" : "Welcome back"}
      title={mode === "signup" ? "Start learning." : "Continue learning."}
      description="Use Google or email and password. This account works in both the web LMS and Claude Teacher inside ChatGPT."
    >
      <StytchLogin config={config} presentation={presentation} />
    </AuthShell>
  );
}
