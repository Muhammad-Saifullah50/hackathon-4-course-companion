import { NextResponse } from "next/server";

import { createServerBillingPortal } from "@/lib/authenticated-api";

export async function POST() {
  try {
    const session = await createServerBillingPortal();
    return NextResponse.redirect(session.url, 303);
  } catch {
    return NextResponse.redirect(
      new URL("/account?billing=unavailable", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
      303,
    );
  }
}
