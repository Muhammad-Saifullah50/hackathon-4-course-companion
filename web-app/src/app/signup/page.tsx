import { Suspense } from "react";

import { AuthScreen } from "@/components/auth-screen";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthScreen mode="signup" />
    </Suspense>
  );
}

function AuthLoading() {
  return <main className="flex min-h-screen items-center justify-center">Loading...</main>;
}
