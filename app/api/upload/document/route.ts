import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

const schema = z.object({
  dataUrl: z.string().startsWith("data:"),
  fileName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const url = await uploadToCloudinary(parsed.data.dataUrl, "guests", parsed.data.fileName);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
