import { prisma } from "@/lib/db/prisma";
import { isTokenExpired } from "@/lib/utils/token";

export async function getGuestFormByToken(token: string) {
  const record = await prisma.guestFormToken.findUnique({
    where: { token },
    include: {
      reservation: {
        include: { property: { include: { user: true } } },
      },
    },
  });

  if (!record) return { error: "Token not found" as const, data: null };
  if (record.used) return { error: "Token already used" as const, data: null };
  if (isTokenExpired(record.expiresAt)) return { error: "Token expired" as const, data: null };

  return { error: null, data: record };
}

export interface SubmitGuestFormInput {
  token: string;
  fullName: string;
  email: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  documentFileUrl?: string;
}

export async function submitGuestForm(input: SubmitGuestFormInput) {
  const { token, ...guestData } = input;

  const tokenRecord = await prisma.guestFormToken.findUnique({
    where: { token },
  });

  if (!tokenRecord) throw new Error("Token not found");
  if (tokenRecord.used) throw new Error("Token already used");
  if (isTokenExpired(tokenRecord.expiresAt)) throw new Error("Token expired");

  const [guest] = await prisma.$transaction([
    prisma.guest.create({
      data: { reservationId: tokenRecord.reservationId, ...guestData },
    }),
    prisma.guestFormToken.update({ where: { token }, data: { used: true } }),
    prisma.reservation.update({
      where: { id: tokenRecord.reservationId },
      data: { status: "guest_submitted" },
    }),
  ]);

  return guest;
}

export interface GuestInput {
  fullName: string;
  email?: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  documentFileUrl?: string;
}

export async function submitMultipleGuests(input: {
  token: string;
  guests: GuestInput[];
}) {
  const { token, guests } = input;

  const tokenRecord = await prisma.guestFormToken.findUnique({ where: { token } });
  if (!tokenRecord) throw new Error("Token not found");
  if (tokenRecord.used) throw new Error("Token already used");
  if (isTokenExpired(tokenRecord.expiresAt)) throw new Error("Token expired");

  const createdGuests = await prisma.$transaction(async (tx) => {
    const created = await Promise.all(
      guests.map((g) =>
        tx.guest.create({
          data: { reservationId: tokenRecord.reservationId, ...g },
        })
      )
    );
    await tx.guestFormToken.update({ where: { token }, data: { used: true } });
    await tx.reservation.update({
      where: { id: tokenRecord.reservationId },
      data: { status: "guest_submitted" },
    });
    return created;
  });

  return createdGuests; // first element is the main guest
}

export async function validateGuestSigningAccess(input: {
  token: string;
  contractId: string;
  guestId: string;
}) {
  const { token, contractId, guestId } = input;

  const tokenRecord = await prisma.guestFormToken.findUnique({
    where: { token },
    include: {
      reservation: {
        include: {
          guests: { select: { id: true } },
          contracts: { select: { id: true } },
        },
      },
    },
  });

  if (!tokenRecord) throw new Error("Token not found");
  if (isTokenExpired(tokenRecord.expiresAt)) throw new Error("Token expired");

  const guestAllowed = tokenRecord.reservation.guests.some((guest) => guest.id === guestId);
  if (!guestAllowed) throw new Error("Guest is not allowed to sign this contract");

  const contractAllowed = tokenRecord.reservation.contracts.some((contract) => contract.id === contractId);
  if (!contractAllowed) throw new Error("Contract is not accessible with this token");
}
