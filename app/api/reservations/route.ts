import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createReservation, getReservations } from "@/lib/services/reservation.service";

const createSchema = z.object({
  propertyId: z.string().uuid(),
  checkInDate: z.string().datetime(),
  checkOutDate: z.string().datetime(),
  source: z.enum(["airbnb", "booking", "direct"]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservations = await getReservations(session.user.id);
  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const reservation = await createReservation({
      ...parsed.data,
      checkInDate: new Date(parsed.data.checkInDate),
      checkOutDate: new Date(parsed.data.checkOutDate),
    });
    return NextResponse.json(reservation, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "DATE_CONFLICT") {
      return NextResponse.json(
        { error: "These dates overlap with an existing reservation for this property." },
        { status: 409 }
      );
    }
    throw err;
  }
}
