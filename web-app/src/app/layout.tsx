import type { Metadata } from "next";
import { Suspense } from "react";

import { AppProviders } from "@/components/app-providers";
import {
  AuthenticatedMobileNav,
  AuthenticatedSiteNav,
} from "@/components/auth-navigation";
import { NavSkeleton } from "@/components/loading-ui";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Teacher",
  description: "Learn AI agent development with Claude Teacher.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="claudeteacher-theme"
        >
          <AppProviders>
            <div className="flex min-h-screen flex-col">
              <Suspense fallback={<NavSkeleton />}>
                <AuthenticatedSiteNav />
              </Suspense>
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <Suspense fallback={null}>
                <AuthenticatedMobileNav />
              </Suspense>
              <SiteFooter />
            </div>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
