import { auth } from "@/auth";
import { getContractsPage } from "@/lib/services/contract.service";
import { getTemplates } from "@/lib/services/template.service";
import ContractsClient, { ContractRow, TemplateRow } from "./ContractsClient";

export default async function ContractsPage() {
  const session = await auth();
  const userId  = session?.user?.id!;

  const [{ contracts, pendingReservations }, dbTemplates] = await Promise.all([
    getContractsPage(userId),
    getTemplates(userId),
  ]);

  // Normalise into a unified row type — convert Date objects to ISO strings
  const rows: ContractRow[] = [
    ...contracts.map((c) => ({
      reservationId:  c.reservation.id,
      propertyName:   c.reservation.property.name,
      guestName:      c.reservation.guests[0]?.fullName ?? "—",
      checkInDate:    c.reservation.checkInDate.toISOString(),
      checkOutDate:   c.reservation.checkOutDate.toISOString(),
      contractId:     c.id,
      contractNumber: c.contractNumber,
      status:         c.status as "signed" | "sent" | "draft",
      pdfUrl:         c.pdfUrl ?? null,
      generatedAt:    c.createdAt.toISOString(),
      signedAt:       c.signedAt?.toISOString() ?? null,
    })),
    ...pendingReservations.map((r) => ({
      reservationId:  r.id,
      propertyName:   r.property.name,
      guestName:      r.guests[0]?.fullName ?? "—",
      checkInDate:    r.checkInDate.toISOString(),
      checkOutDate:   r.checkOutDate.toISOString(),
      contractId:     null,
      contractNumber: null,
      status:         "none" as const,
      pdfUrl:         null,
      generatedAt:    null,
      signedAt:       null,
    })),
  ];

  const templates: TemplateRow[] = dbTemplates.map((t) => ({
    id:        t.id,
    name:      t.name,
    html:      t.html,
    isDefault: t.isDefault,
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <ContractsClient rows={rows} templates={templates} />;
}
