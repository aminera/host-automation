import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestFormByToken, submitGuestForm } from "@/lib/services/guest.service";
import { generateContract } from "@/lib/services/contract.service";

const submitSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  documentType: z.enum(["passport", "id_card", "driving_license"]).optional(),
  documentNumber: z.string().optional(),
  documentFileUrl: z.string().url().optional(),
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
    // 1. Save guest info and mark token as used
    const guest = await submitGuestForm({ token, ...parsed.data });

    // 2. Auto-generate the contract PDF so the guest can sign immediately
    let contractId: string | null = null;
    try {
      const contract = await generateContract(guest.reservationId);
      contractId = contract.id;
    } catch (contractErr) {
      // Log but don't fail the whole request — guest data is saved
      console.error("[auto-generate contract]:", contractErr);
    }

    return NextResponse.json({ ...guest, contractId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
