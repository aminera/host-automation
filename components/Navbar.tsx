import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-gray-900 text-sm tracking-tight">
            HostAutomation
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-gray-900">Reservations</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 hidden sm:block">{session?.user?.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-gray-500 hover:text-red-600 transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
