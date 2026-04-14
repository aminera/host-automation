import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getReservations } from "@/lib/services/reservation.service";
import { prisma } from "@/lib/db/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [reservations, properties] = await Promise.all([
    getReservations(session.user.id),
    prisma.property.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, address: true, city: true, country: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const metrics = {
    properties: properties.length,
    reservationsThisMonth: reservations.filter((r) => {
      const d = new Date(r.checkInDate);
      return d >= monthStart && d <= monthEnd;
    }).length,
    contractsSigned: reservations.filter((r) =>
      r.contracts.some((c) => c.status === "signed")
    ).length,
    pendingActions: reservations.filter((r) => r.status === "pending").length,
  };

  // Format dates to ISO strings for client component
  const formattedReservations = reservations.map((r) => ({
    ...r,
    checkInDate: r.checkInDate.toISOString(),
    checkOutDate: r.checkOutDate.toISOString(),
  }));

  return (
    <Suspense>
      <DashboardClient
        reservations={formattedReservations}
        properties={properties}
        metrics={metrics}
      />
    </Suspense>
  );
}
