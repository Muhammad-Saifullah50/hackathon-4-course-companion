import { Suspense } from "react";

import { AuthSkeleton } from "@/components/loading-ui";
import { PasswordResetScreen } from "@/components/password-reset-screen";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <PasswordResetScreen />
    </Suspense>
  );
}
