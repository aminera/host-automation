import { prisma } from "@/lib/db/prisma";
import { renderTemplate } from "@/lib/utils/contract-template";
import { getOrCreateDefaultTemplate } from "@/lib/services/template.service";
import { generatePdfFromHtml } from "@/lib/utils/pdf-generator";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

// Helper to build contract render data
async function buildContractHtmlData(
  contract: { contractNumber: string },
  property: { name: string; address: string; city: string; country: string; user: { fullName: string } },
  guest: { fullName: string; email?: string | null; phone?: string | null; documentType?: string | null; documentNumber?: string | null },
  reservation: { checkInDate: Date; checkOutDate: Date },
  generatedAt: string,
  signatureImageUrl?: string
) {
  return {
    contractNumber:   contract.contractNumber,
    hostName:         property.user.fullName,
    propertyName:     property.name,
    propertyAddress:  `${property.address}, ${property.city}, ${property.country}`,
    guestName:        guest.fullName,
    guestEmail:       guest.email ?? "",
    guestPhone:       guest.phone ?? undefined,
    documentType:     guest.documentType ?? undefined,
    documentNumber:   guest.documentNumber ?? undefined,
    checkInDate:      reservation.checkInDate.toLocaleDateString("en-GB"),
    checkOutDate:     reservation.checkOutDate.toLocaleDateString("en-GB"),
    generatedAt,
    signatureImageUrl,
  };
}

export async function getContractsPage(userId: string) {
  const [contracts, pendingReservations] = await Promise.all([
    // All contracts belonging to this host — one per reservation (most recent)
    prisma.contract.findMany({
      where:    { reservation: { property: { userId } } },
      distinct: ["reservationId"],
      include: {
        reservation: {
          include: {
            property: { select: { name: true } },
            guests:   { select: { id: true, fullName: true } },
          },
        },
        signatures: {
          select:  { signedAt: true },
          orderBy: { signedAt: "asc" as const },
          take:    1,
        },
      },
      orderBy: { createdAt: "desc" as const },
    }),
    // Reservations with guests submitted but no contract yet
    prisma.reservation.findMany({
      where: {
        property:  { userId },
        status:    "guest_submitted",
        contracts: { none: {} },
      },
      include: {
        property: { select: { name: true } },
        guests:   { select: { id: true, fullName: true } },
      },
      orderBy: { checkInDate: "asc" as const },
    }),
  ]);

  return { contracts, pendingReservations };
}

export async function generateContract(reservationId: string) {
  // Fetch reservation data, existing contract, and any existing signature in parallel
  const [reservation, existingContract, existingSignature] = await Promise.all([
    prisma.reservation.findUnique({
      where:   { id: reservationId },
      include: { property: { include: { user: true } }, guests: true },
    }),
    // Reuse existing contract to avoid duplicates
    prisma.contract.findFirst({
      where:   { reservationId },
      orderBy: { createdAt: "desc" },
    }),
    // Carry forward any existing signature
    prisma.signature.findFirst({
      where:   { contract: { reservationId } },
      orderBy: { signedAt: "desc" },
    }),
  ]);

  if (!reservation) throw new Error("Reservation not found");
  if (!reservation.guests.length) throw new Error("No guest found for this reservation");

  const guest      = reservation.guests[0];
  const { property } = reservation;
  const isSigned   = existingSignature !== null;
  const generatedAt = new Date().toLocaleDateString("en-GB");

  // Reuse existing contract record (avoid duplicates) or create one
  const contract = existingContract ?? await prisma.contract.create({
    data: { reservationId, status: "draft" },
  });

  // Fetch (or seed) the host's default template
  const template = await getOrCreateDefaultTemplate(property.userId);

  const htmlData = await buildContractHtmlData(
    contract,
    property,
    guest,
    reservation,
    generatedAt,
    existingSignature?.signatureImageUrl
  );

  const html = renderTemplate(template.html, htmlData);

  const pdfBuffer = await generatePdfFromHtml(html);
  const pdfUrl    = await uploadToCloudinary(
    pdfBuffer,
    "contracts",
    `contract-${contract.contractNumber}${isSigned ? "-signed" : ""}`
  );

  const updatedContract = await prisma.contract.update({
    where: { id: contract.id },
    data: {
      pdfUrl,
      status:   isSigned ? "signed" : "sent",
      signedAt: isSigned ? existingSignature!.signedAt : null,
    },
  });

  // Ensure a signature record exists on this contract (use upsert to avoid TOCTOU)
  if (isSigned && existingSignature) {
    await prisma.signature.upsert({
      where: { id: existingSignature.id },
      update: { contractId: contract.id },
      create: {
        contractId:        contract.id,
        guestId:           existingSignature.guestId,
        signatureImageUrl: existingSignature.signatureImageUrl,
        signedAt:          existingSignature.signedAt,
      },
    });
  }

  return updatedContract;
}

export async function signContract(
  contractId: string,
  guestId: string,
  signatureImageUrl: string
) {
  const contract = await prisma.contract.findUnique({
    where:   { id: contractId },
    include: {
      reservation: {
        include: { property: { include: { user: true } }, guests: true },
      },
    },
  });
  if (!contract) throw new Error("Contract not found");
  if (contract.status === "signed") throw new Error("Contract already signed");

  const { reservation } = contract;
  const guest    = reservation.guests.find((g) => g.id === guestId) ?? reservation.guests[0];
  const { property } = reservation;
  const generatedAt = new Date().toLocaleDateString("en-GB");

  // Fetch (or seed) the host's default template
  const template = await getOrCreateDefaultTemplate(property.userId);

  const htmlData = await buildContractHtmlData(
    contract,
    property,
    guest,
    reservation,
    generatedAt,
    signatureImageUrl
  );

  const html = renderTemplate(template.html, htmlData);

  const pdfBuffer     = await generatePdfFromHtml(html);
  const signedPdfUrl  = await uploadToCloudinary(
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
      data:  { status: "signed", signedAt: new Date(), pdfUrl: signedPdfUrl },
    }),
  ]);

  return signature;
}
