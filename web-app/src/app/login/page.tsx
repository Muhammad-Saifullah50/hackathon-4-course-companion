import { Suspense } from "react";

import { AuthScreen } from "@/components/auth-screen";
import { AuthSkeleton } from "@/components/loading-ui";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
