import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnReservations = req.nextUrl.pathname.startsWith("/reservations");
  const isOnContracts = req.nextUrl.pathname.startsWith("/contracts");

  if ((isOnDashboard || isOnReservations || isOnContracts) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/reservations/:path*", "/contracts/:path*"],
};
