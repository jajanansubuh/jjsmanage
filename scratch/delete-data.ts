import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Deleting all data...");

  // Delete in order to avoid foreign key constraints
  const deleteReports = await prisma.consignmentReport.deleteMany();
  console.log(`Deleted ${deleteReports.count} reports`);

  const deleteSuppliers = await prisma.supplier.deleteMany();
  console.log(`Deleted ${deleteSuppliers.count} suppliers`);

  const deleteCashiers = await prisma.cashier.deleteMany();
  console.log(`Deleted ${deleteCashiers.count} cashiers`);

  console.log("All data deleted successfully");
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
