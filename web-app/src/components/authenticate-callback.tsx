"use client";

import { useStytch } from "@stytch/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { consumeReturnTo } from "@/lib/auth-navigation";
import { SESSION_DURATION_MINUTES } from "@/lib/stytch-config";

export function AuthenticateCallback() {
  const stytch = useStytch();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void stytch
      .authenticateByUrl({
        session_duration_minutes: SESSION_DURATION_MINUTES,
      })
      .then((result) => {
        if (!result?.handled) {
          throw new Error("The authentication callback did not contain a valid token.");
        }
        router.replace(consumeReturnTo());
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Authentication could not be completed.",
        );
      });
  }, [router, stytch]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-950">
          {error ? "Authentication failed" : "Finishing sign in"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {error ?? "Please keep this page open for a moment."}
        </p>
      </div>
    </main>
  );
}
