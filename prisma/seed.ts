import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding data...");

  // Create Suppliers
  const s1 = await prisma.supplier.create({
    data: { 
      name: "Batik Sejahtera", 
      ownerName: "Bpk. Hendra", 
      accountNumber: "BCA 1234567890",
      balance: 0
    },
  });
  const s2 = await prisma.supplier.create({
    data: { 
      name: "Kopi Nusantara", 
      ownerName: "Ibu Maya", 
      accountNumber: "Mandiri 0987654321",
      balance: 0
    },
  });

  // Create Cashiers
  await prisma.cashier.create({
    data: { name: "Budi", code: "KSR001" },
  });
  await prisma.cashier.create({
    data: { name: "Siti", code: "KSR002" },
  });

  console.log("Seeding completed.");
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
