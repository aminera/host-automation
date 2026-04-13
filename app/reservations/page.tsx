import { auth } from "@/auth";
import { getReservations } from "@/lib/services/reservation.service";
import ReservationsClient from "./ReservationsClient";

export default async function ReservationsPage() {
  const session = await auth();
  const userId  = session?.user?.id!;

  const raw = await getReservations(userId);

  const reservations = raw.map((r) => ({
    id:           r.id,
    status:       r.status,
    source:       r.source,
    checkInDate:  r.checkInDate.toISOString(),
    checkOutDate: r.checkOutDate.toISOString(),
    createdAt:    r.createdAt.toISOString(),
    property: { id: r.property.id, name: r.property.name },
    guests:   r.guests.map((g) => ({ id: g.id, fullName: g.fullName })),
    contracts: r.contracts.map((c) => ({ id: c.id, status: c.status })),
  }));

  return <ReservationsClient reservations={reservations} />;
}
