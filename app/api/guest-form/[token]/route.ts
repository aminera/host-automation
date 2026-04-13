import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestFormByToken, submitMultipleGuests } from "@/lib/services/guest.service";
import { generateContract } from "@/lib/services/contract.service";

const mainGuestSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),           // required for main guest
  phone: z.string().min(1),            // required for main guest
  documentType: z.enum(["passport", "id_card", "driving_license"]).optional(),
  documentNumber: z.string().min(1).optional(),
  documentFileUrl: z.string().url().optional(),
});

const additionalGuestSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional(), // optional for additional guests
  phone: z.string().optional(),
  documentType: z.enum(["passport", "id_card", "driving_license"]).optional(),
  documentNumber: z.string().min(1).optional(),
  documentFileUrl: z.string().url().optional(),
});

const submitSchema = z.object({
  guests: z
    .array(additionalGuestSchema)
    .min(1)
    .superRefine((guests, ctx) => {
      const main = mainGuestSchema.safeParse(guests[0]);
      if (!main.success) {
        main.error.issues.forEach((issue) =>
          ctx.addIssue({ ...issue, path: [0, ...(issue.path ?? [])] })
        );
      }
    }),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await getGuestFormByToken(token);

  if (result.error) {
    const status = result.error === "Token not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const { reservation } = result.data;
  return NextResponse.json({
    reservationId: reservation.id,
    propertyName: reservation.property.name,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    expiresAt: result.data.expiresAt,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const guests = await submitMultipleGuests({ token, guests: parsed.data.guests });
    const mainGuest = guests[0];

    let contractId: string | null = null;
    try {
      const contract = await generateContract(mainGuest.reservationId);
      contractId = contract.id;
    } catch (err) {
      console.error("[auto-generate contract]:", err);
    }

    return NextResponse.json({ id: mainGuest.id, contractId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
