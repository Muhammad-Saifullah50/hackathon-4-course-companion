import { Suspense } from "react";

import { PasswordResetScreen } from "@/components/password-reset-screen";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading password reset...</main>}>
      <PasswordResetScreen />
    </Suspense>
  );
}
