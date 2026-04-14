import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [currentUser, users] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, fullName: true, email: true, phone: true },
    }),
    prisma.user.findMany({
      select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!currentUser) redirect("/login");

  return <SettingsClient currentUser={currentUser} initialUsers={users} />;
}
