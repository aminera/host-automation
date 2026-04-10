import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateGuestFormToken } from "@/lib/services/reservation.service";

// POST /api/reservations/[id]/token — generate a guest form token for a reservation
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tokenRecord = await generateGuestFormToken(id);

  const link = `${process.env.NEXTAUTH_URL}/guest-form/${tokenRecord.token}`;
  return NextResponse.json({ token: tokenRecord.token, link, expiresAt: tokenRecord.expiresAt });
}
