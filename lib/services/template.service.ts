import { prisma } from "@/lib/db/prisma";
import { DEFAULT_TEMPLATE_HTML } from "@/lib/utils/contract-template";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TemplateRow = {
  id:        string;
  name:      string;
  html:      string;
  isDefault: boolean;
  updatedAt: string; // ISO string
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getTemplates(userId: string) {
  return prisma.contractTemplate.findMany({
    where:   { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTemplateById(id: string, userId: string) {
  return prisma.contractTemplate.findFirst({
    where: { id, userId },
  });
}

/**
 * Returns the user's default template. If none exists, seeds the built-in
 * "Standard rental" template and marks it as default.
 */
export async function getOrCreateDefaultTemplate(userId: string) {
  const existing = await prisma.contractTemplate.findFirst({
    where: { userId, isDefault: true },
  });
  if (existing) return existing;

  return prisma.contractTemplate.create({
    data: {
      userId,
      name:      "Standard rental",
      html:      DEFAULT_TEMPLATE_HTML,
      isDefault: true,
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createTemplate(
  userId: string,
  data: { name: string; html: string; isDefault: boolean }
) {
  if (data.isDefault) {
    await prisma.$transaction([
      prisma.contractTemplate.updateMany({
        where: { userId },
        data:  { isDefault: false },
      }),
      prisma.contractTemplate.create({ data: { userId, ...data } }),
    ]);
    return prisma.contractTemplate.findFirst({
      where: { userId, name: data.name, isDefault: true },
    });
  }
  return prisma.contractTemplate.create({ data: { userId, ...data } });
}

export async function updateTemplate(
  id: string,
  userId: string,
  data: { name: string; html: string; isDefault: boolean }
) {
  const existing = await prisma.contractTemplate.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Template not found");

  if (data.isDefault) {
    await prisma.$transaction([
      prisma.contractTemplate.updateMany({
        where: { userId, id: { not: id } },
        data:  { isDefault: false },
      }),
      prisma.contractTemplate.update({ where: { id }, data }),
    ]);
  } else {
    await prisma.contractTemplate.update({ where: { id }, data });
  }
  return prisma.contractTemplate.findUnique({ where: { id } });
}

export async function deleteTemplate(id: string, userId: string) {
  const existing = await prisma.contractTemplate.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Template not found");
  if (existing.isDefault) throw new Error("Cannot delete the default template");
  return prisma.contractTemplate.delete({ where: { id } });
}
