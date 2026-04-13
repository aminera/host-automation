import { prisma } from "@/lib/db/prisma";
import { generateToken, getTokenExpiry } from "@/lib/utils/token";

export interface CreateReservationInput {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  source?: string;
}

export async function getBookedDateRanges(propertyId: string) {
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: { notIn: ["cancelled"] },
    },
    select: { id: true, checkInDate: true, checkOutDate: true },
  });
  return reservations.map((r) => ({
    id: r.id,
    checkIn: r.checkInDate.toISOString(),
    checkOut: r.checkOutDate.toISOString(),
  }));
}

export async function hasDateConflict(
  propertyId: string,
  checkInDate: Date,
  checkOutDate: Date,
  excludeId?: string
): Promise<boolean> {
  const conflict = await prisma.reservation.findFirst({
    where: {
      propertyId,
      status: { notIn: ["cancelled"] },
      id: excludeId ? { not: excludeId } : undefined,
      // Overlap: existing.checkIn < newCheckOut AND existing.checkOut > newCheckIn
      checkInDate: { lt: checkOutDate },
      checkOutDate: { gt: checkInDate },
    },
    select: { id: true },
  });
  return conflict !== null;
}

export async function createReservation(data: CreateReservationInput) {
  const conflict = await hasDateConflict(
    data.propertyId,
    data.checkInDate,
    data.checkOutDate
  );
  if (conflict) {
    throw new Error("DATE_CONFLICT");
  }

  return prisma.reservation.create({
    data: {
      propertyId: data.propertyId,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      source: data.source ?? "direct",
      status: "pending",
    },
    include: { property: true },
  });
}

export async function getReservations(userId: string) {
  return prisma.reservation.findMany({
    where: { property: { userId } },
    include: {
      property: true,
      guests: true,
      contracts: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReservationById(id: string, userId: string) {
  return prisma.reservation.findFirst({
    where: { id, property: { userId } },
    include: {
      property: true,
      guests: true,
      contracts: {
        include: {
          signatures: {
            include: { guest: { select: { fullName: true } } },
            orderBy: { signedAt: "asc" as const },
          },
        },
        orderBy: { createdAt: "desc" as const },
      },
      guestFormTokens: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function generateGuestFormToken(reservationId: string, userId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      property: { userId },
    },
    select: { id: true },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  const token = generateToken();
  const expiresAt = getTokenExpiry(72);

  return prisma.guestFormToken.create({
    data: {
      reservationId: reservation.id,
      token,
      expiresAt,
    },
  });
}
