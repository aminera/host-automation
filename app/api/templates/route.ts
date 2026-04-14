import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTemplates, createTemplate } from "@/lib/services/template.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await getTemplates(session.user.id);
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, html, isDefault } = body as { name: string; html: string; isDefault: boolean };

  if (!name?.trim() || !html?.trim()) {
    return NextResponse.json({ error: "name and html are required" }, { status: 400 });
  }

  const template = await createTemplate(session.user.id, { name, html, isDefault: !!isDefault });
  return NextResponse.json(template, { status: 201 });
}
