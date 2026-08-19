import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = "admin@ezfinanz.com";
  const adminPassword = "Admin@12345";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash, // Forces password update in case old hash was wrong/plaintext
      role: "ADMIN",
    },
    create: {
      name: "EZFINANZ Admin",
      email: adminEmail,
      phone: "9999999999",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log("Admin user seeded/updated successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });