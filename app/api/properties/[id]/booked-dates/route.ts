import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBookedDateRanges } from "@/lib/services/reservation.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ranges = await getBookedDateRanges(id);
  return NextResponse.json(ranges);
}
