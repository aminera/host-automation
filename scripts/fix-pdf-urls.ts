import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";

async function run() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // First, show all contracts
  const check = await client.query(`SELECT id, "pdfUrl", status FROM "Contract"`);
  console.log("All contracts:", check.rows);

  // Fix image/upload -> raw/upload
  const fix = await client.query(`
    UPDATE "Contract"
    SET "pdfUrl" = REPLACE("pdfUrl", '/image/upload/', '/raw/upload/')
    WHERE "pdfUrl" LIKE '%/image/upload/%'
    RETURNING id, "pdfUrl"
  `);
  console.log(`Fixed ${fix.rowCount} contract(s):`);
  fix.rows.forEach((r) => console.log(" ", r.id, "->", r.pdfUrl));

  await client.end();
}

run().catch(console.error);
