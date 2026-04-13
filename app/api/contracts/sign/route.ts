import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";
import { signContract } from "@/lib/services/contract.service";
import { validateGuestSigningAccess } from "@/lib/services/guest.service";

const schema = z.object({
  token: z.string().min(1),
  contractId: z.string().uuid(),
  guestId: z.string().uuid(),
  // base64 data URI of the signature image: data:image/png;base64,...
  signatureDataUrl: z.string().startsWith("data:image/"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, contractId, guestId, signatureDataUrl } = parsed.data;

  try {
    await validateGuestSigningAccess({ token, contractId, guestId });

    const signatureImageUrl = await uploadToCloudinary(
      signatureDataUrl,
      "signatures",
      `sig-${contractId}-${Date.now()}`
    );
    const signature = await signContract(contractId, guestId, signatureImageUrl);
    return NextResponse.json(signature, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
