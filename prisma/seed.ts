import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@hostautomation.com";
  const password = "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User already exists: ${email}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      fullName: "Admin Host",
      email,
      passwordHash: hashSync(password, 10),
      phone: "+33 6 00 00 00 00",
      properties: {
        create: {
          name: "Appartement Paris",
          address: "12 Rue de Rivoli",
          city: "Paris",
          country: "France",
        },
      },
    },
    include: { properties: true },
  });

  console.log("✓ User created:");
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Property: ${user.properties[0].name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
