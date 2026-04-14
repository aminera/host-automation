"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  font-size: 13px;
  padding-bottom: 2px;
  text-decoration: none;
  transition: color 0.15s;
  color: ${({ $active }) => $active ? "var(--app-text-1)" : "var(--app-text-2)"};
  font-weight: ${({ $active }) => $active ? 500 : 400};
  border-bottom: 2px solid ${({ $active }) => $active ? "var(--app-blue)" : "transparent"};
`;

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reservations", label: "Reservations", match: "/reservations" },
  { href: "/contracts", label: "Contracts", match: "/contracts" },
  { href: "/settings", label: "Settings", match: "/settings" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <Nav>
      {links.map(({ href, label, match }) => {
        const active = pathname === href || (match ? pathname.startsWith(match) : false);
        return (
          <NavLink key={href} href={href} $active={active}>
            {label}
          </NavLink>
        );
      })}
    </Nav>
  );
}
