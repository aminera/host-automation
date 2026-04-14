import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTemplateById } from "@/lib/services/template.service";
import { DEFAULT_TEMPLATE_HTML } from "@/lib/utils/contract-template";
import TemplateEditor from "./TemplateEditor";

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId  = session?.user?.id!;

  const { id } = await params;
  const isNew   = id === "new";

  const template = isNew ? null : await getTemplateById(id, userId);
  if (!isNew && !template) redirect("/contracts");

  return (
    <TemplateEditor
      templateId={template?.id ?? null}
      initialName={template?.name ?? "New template"}
      initialHtml={template?.html ?? DEFAULT_TEMPLATE_HTML}
      initialIsDefault={template?.isDefault ?? false}
    />
  );
}
