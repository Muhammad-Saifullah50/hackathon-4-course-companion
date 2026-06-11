import { Suspense } from "react";

import { AuthenticateCallback } from "@/components/authenticate-callback";

export default function AuthenticatePage() {
  return (
    <Suspense fallback={<main className="p-6">Finishing sign in...</main>}>
      <AuthenticateCallback />
    </Suspense>
  );
}
