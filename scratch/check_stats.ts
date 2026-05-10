
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  const suppliers = await prisma.supplier.findMany({
    where: {
      name: {
        in: ['BUDI BACANG', 'KBB', 'A1', 'HERA', 'CJR']
      }
    },
    select: { id: true, name: true }
  });

  console.log('Suppliers:', suppliers);

  for (const supplier of suppliers) {
    const reports = await prisma.consignmentReport.findMany({
      where: { supplierId: supplier.id },
      select: { id: true, noteNumber: true, createdAt: true, revenue: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`\nReports for ${supplier.name}:`);
    console.table(reports);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
