import { prisma } from "@/lib/db/prisma";
import { buildContractHtml } from "@/lib/utils/contract-template";
import { generatePdfFromHtml } from "@/lib/utils/pdf-generator";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

export async function generateContract(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      property: { include: { user: true } },
      guests: true,
    },
  });

  if (!reservation) throw new Error("Reservation not found");
  if (!reservation.guests.length) throw new Error("No guest found for this reservation");

  const guest = reservation.guests[0];
  const { property } = reservation;

  // Create a draft contract record first to get the contract number
  const contract = await prisma.contract.create({
    data: {
      reservationId,
      status: "draft",
    },
  });

  const html = buildContractHtml({
    contractNumber: contract.contractNumber,
    hostName: property.user.fullName,
    propertyName: property.name,
    propertyAddress: `${property.address}, ${property.city}, ${property.country}`,
    guestName: guest.fullName,
    guestEmail: guest.email,
    guestPhone: guest.phone ?? undefined,
    documentType: guest.documentType ?? undefined,
    documentNumber: guest.documentNumber ?? undefined,
    checkInDate: reservation.checkInDate.toLocaleDateString("en-GB"),
    checkOutDate: reservation.checkOutDate.toLocaleDateString("en-GB"),
    generatedAt: new Date().toLocaleDateString("en-GB"),
  });

  const pdfBuffer = await generatePdfFromHtml(html);
  const pdfUrl = await uploadToCloudinary(
    pdfBuffer,
    "contracts",
    `contract-${contract.contractNumber}`
  );

  return prisma.contract.update({
    where: { id: contract.id },
    data: { pdfUrl, status: "sent" },
  });
}

export async function signContract(
  contractId: string,
  guestId: string,
  signatureImageUrl: string
) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      reservation: {
        include: {
          property: { include: { user: true } },
          guests: true,
        },
      },
    },
  });
  if (!contract) throw new Error("Contract not found");
  if (contract.status === "signed") throw new Error("Contract already signed");

  // Re-generate the PDF with the signature embedded
  const { reservation } = contract;
  const guest = reservation.guests.find((g) => g.id === guestId) ?? reservation.guests[0];
  const { property } = reservation;

  const html = buildContractHtml({
    contractNumber: contract.contractNumber,
    hostName: property.user.fullName,
    propertyName: property.name,
    propertyAddress: `${property.address}, ${property.city}, ${property.country}`,
    guestName: guest.fullName,
    guestEmail: guest.email,
    guestPhone: guest.phone ?? undefined,
    documentType: guest.documentType ?? undefined,
    documentNumber: guest.documentNumber ?? undefined,
    checkInDate: reservation.checkInDate.toLocaleDateString("en-GB"),
    checkOutDate: reservation.checkOutDate.toLocaleDateString("en-GB"),
    generatedAt: new Date().toLocaleDateString("en-GB"),
    signatureImageUrl,
  });

  const pdfBuffer = await generatePdfFromHtml(html);
  const signedPdfUrl = await uploadToCloudinary(
    pdfBuffer,
    "contracts",
    `contract-${contract.contractNumber}-signed`
  );

  const [signature] = await prisma.$transaction([
    prisma.signature.create({
      data: { contractId, guestId, signatureImageUrl },
    }),
    prisma.contract.update({
      where: { id: contractId },
      data: { status: "signed", signedAt: new Date(), pdfUrl: signedPdfUrl },
    }),
  ]);

  return signature;
}
