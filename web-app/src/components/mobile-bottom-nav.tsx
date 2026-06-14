"use client";

import { BarChart3, BookOpen, Home, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBottomNav({
  authenticated,
}: {
  authenticated: boolean;
}) {
  const pathname = usePathname();
  if (!authenticated) return null;

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/course", label: "Course", icon: BookOpen },
    { href: "/progress", label: "Progress", icon: BarChart3 },
    { href: "/search", label: "Search", icon: Search },
  ];
  return (
    <nav className="mobile-bottom" aria-label="Mobile shortcuts">
      {links.map((link) => (
        <Link key={link.href} href={link.href} data-active={pathname === link.href}>
          <link.icon size={17} />
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
