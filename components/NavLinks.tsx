"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reservations", label: "Reservations", match: "/reservations" },
  { href: "/contracts", label: "Contracts", match: "/contracts" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6">
      {links.map(({ href, label, match }) => {
        const active = pathname === href || (match ? pathname.startsWith(match) : false);
        return (
          <Link
            key={href}
            href={href}
            className="text-[13px] pb-px transition"
            style={{
              color: active ? "var(--app-text-1)" : "var(--app-text-2)",
              fontWeight: active ? 500 : 400,
              borderBottom: active ? "2px solid var(--app-blue)" : "2px solid transparent",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
