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
      data: {
        reservationId: tokenRecord.reservationId,
        ...guestData,
      },
    }),
    prisma.guestFormToken.update({
      where: { token },
      data: { used: true },
    }),
    prisma.reservation.update({
      where: { id: tokenRecord.reservationId },
      data: { status: "guest_submitted" },
    }),
  ]);

  return guest;
}
