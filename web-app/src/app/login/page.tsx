import { Suspense } from "react";

import { AuthScreen } from "@/components/auth-screen";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}

function AuthLoading() {
  return <main className="flex min-h-screen items-center justify-center">Loading...</main>;
}
