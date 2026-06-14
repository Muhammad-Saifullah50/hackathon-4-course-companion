"use client";

import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Flame,
  LogOut,
  Menu,
  Search,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import type { AuthSession } from "@/lib/api-types";

const links = [
  { href: "/course", label: "Course", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/search", label: "Search", icon: Search },
];

export function SiteNav({ session }: { session: AuthSession | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const authenticated = Boolean(session);
  const email = session?.email ?? "";
  const name = email.split("@")[0] || "Learner";

  function active(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--emerald)] text-white">
            <BookOpen size={14} />
          </span>
          <span>Claude<span className="text-[var(--emerald)]">Teacher</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {authenticated && (
            <Link href="/dashboard" className={`nav-link ${active("/dashboard") ? "nav-active" : ""}`}>
              Dashboard
            </Link>
          )}
          {links
            .filter((link) => authenticated || link.href === "/course")
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active(link.href) ? "nav-active" : ""}`}
              >
                <link.icon size={14} />
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-1">
          {authenticated && (
            <span className="hidden items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] sm:flex">
              <Flame size={13} className="text-orange-500" /> UTC
            </span>
          )}
          <ThemeToggle />
          {authenticated ? (
            <div className="relative hidden md:block">
              <button className="account-button" onClick={() => setAccountOpen(!accountOpen)}>
                <span className="avatar">{name.charAt(0).toUpperCase()}</span>
                <span>{name}</span>
                <ChevronDown size={13} />
              </button>
              {accountOpen && (
                <div className="account-menu">
                  <p className="truncate border-b border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)]">{email}</p>
                  <Link href="/account" onClick={() => setAccountOpen(false)}>
                    <User size={14} /> Account
                  </Link>
                  <button onClick={() => router.push("/logout")}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="nav-link">Sign in</Link>
              <Link href="/signup" className="button-primary min-h-9 py-1.5">Create account</Link>
            </div>
          )}
          <button
            className="icon-button md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {authenticated && <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {links
            .filter((link) => authenticated || link.href === "/course")
            .map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                <link.icon size={15} /> {link.label}
              </Link>
            ))}
          {authenticated ? (
            <>
              <Link href="/account" onClick={() => setMenuOpen(false)}><User size={15} /> Account</Link>
              <Link href="/logout"><LogOut size={15} /> Sign out</Link>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/signup">Create account</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
