"use client";

import { useStytch } from "@stytch/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LogoutScreen() {
  const stytch = useStytch();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void stytch.session
      .revoke()
      .then(() => router.replace("/login"))
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Sign out failed.");
      });
  }, [router, stytch]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-zinc-600">{error ?? "Signing out..."}</p>
    </main>
  );
}
