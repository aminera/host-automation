import { prisma } from "@/lib/db/prisma";
import { generateToken, getTokenExpiry } from "@/lib/utils/token";

export interface CreateReservationInput {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  source?: string;
}

export async function createReservation(data: CreateReservationInput) {
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
      contracts: true,
      guestFormTokens: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function generateGuestFormToken(reservationId: string) {
  const token = generateToken();
  const expiresAt = getTokenExpiry(72);

  return prisma.guestFormToken.create({
    data: {
      reservationId,
      token,
      expiresAt,
    },
  });
}
