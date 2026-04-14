import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getContractsPage } from "@/lib/services/contract.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getContractsPage(session.user.id);
  return NextResponse.json(data);
}
