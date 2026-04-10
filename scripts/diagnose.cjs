import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { v2 as cloudinary } from "cloudinary";

async function run() {
  // 1. Test Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("Cloudinary cloud_name:", process.env.CLOUDINARY_CLOUD_NAME);
  try {
    const result = await cloudinary.api.ping();
    console.log("✓ Cloudinary ping:", result.status);
  } catch (e: any) {
    console.error("✗ Cloudinary FAIL:", e.message);
  }

  // 2. Check DB
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  const reservation = await prisma.reservation.findFirst({
    include: { property: { include: { user: true } }, guests: true },
  });

  if (!reservation) {
    console.log("✗ No reservation found in DB");
  } else {
    console.log(`✓ Reservation: ${reservation.id}`);
    console.log(`  Guests: ${reservation.guests.length}`);
    if (reservation.guests.length === 0) {
      console.log("  WARNING: No guests — contract generation will fail");
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);

