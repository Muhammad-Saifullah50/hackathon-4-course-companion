import { Suspense } from "react";

import { AuthenticateCallback } from "@/components/authenticate-callback";
import { BrandedLoader } from "@/components/loading-ui";

export default function AuthenticatePage() {
  return (
    <Suspense fallback={<BrandedLoader label="Finishing sign in" />}>
      <AuthenticateCallback />
    </Suspense>
  );
}
