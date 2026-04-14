import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTemplateById } from "@/lib/services/template.service";
import { renderTemplate, SAMPLE_RENDER_DATA } from "@/lib/utils/contract-template";
import { generatePdfFromHtml } from "@/lib/utils/pdf-generator";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/templates/[id]/preview
 * Body (optional): { html: string }  — if provided, uses that HTML instead of the saved template.
 * Returns a PDF binary so the client can open it in a new tab.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Accept optional override HTML from the editor (unsaved preview)
  let html: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.html === "string") html = body.html;
  } catch {
    // no body or non-JSON — that's fine
  }

  if (!html) {
    const template = await getTemplateById(id, session.user.id);
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    html = template.html;
  }

  const rendered  = renderTemplate(html, SAMPLE_RENDER_DATA);
  const pdfBuffer = await generatePdfFromHtml(rendered);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": 'inline; filename="preview.pdf"',
    },
  });
}
