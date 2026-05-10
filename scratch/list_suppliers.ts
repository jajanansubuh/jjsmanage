import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const suppliers = await prisma.supplier.findMany({ select: { name: true } });
  console.log(JSON.stringify(suppliers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
