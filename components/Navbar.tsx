import { Suspense } from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import NavLinks from "./NavLinks";
import ThemeToggle from "./ThemeToggle";

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header
      className="sticky top-0 z-10"
      style={{
        background: "var(--app-surface)",
        borderBottom: "0.5px solid var(--app-border)",
        height: "52px",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-[15px] font-semibold" style={{ color: "var(--app-text-1)" }}>
            HostAutomation
          </Link>
          <Suspense>
            <NavLinks />
          </Suspense>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-[12px] transition navbar-signout">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
