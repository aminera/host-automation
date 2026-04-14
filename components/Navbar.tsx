import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import NavLinks from "./NavLinks";
import ThemeToggle from "./ThemeToggle";
import { NavHeader, NavInner, NavLeft, NavBrand, NavRight } from "./NavbarStyles";

export default async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <NavHeader>
      <NavInner>
        <NavLeft>
          <NavBrand href="/dashboard">HostAutomation</NavBrand>
          <Suspense>
            <NavLinks />
          </Suspense>
        </NavLeft>

        <NavRight>
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="navbar-signout" style={{ fontSize: 12, transition: "color 0.15s", background: "none", border: "none", cursor: "pointer" }}>
              Sign out
            </button>
          </form>
        </NavRight>
      </NavInner>
    </NavHeader>
  );
}
