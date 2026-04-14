import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTemplateById, updateTemplate, deleteTemplate } from "@/lib/services/template.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const template = await getTemplateById(id, session.user.id);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(template);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, html, isDefault } = body as { name: string; html: string; isDefault: boolean };

  if (!name?.trim() || !html?.trim()) {
    return NextResponse.json({ error: "name and html are required" }, { status: 400 });
  }

  try {
    const template = await updateTemplate(id, session.user.id, { name, html, isDefault: !!isDefault });
    return NextResponse.json(template);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await deleteTemplate(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
