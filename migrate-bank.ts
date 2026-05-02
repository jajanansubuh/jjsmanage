import prisma from './src/lib/prisma';

async function main() {
  console.log('Starting migration...');
  const suppliers = await prisma.supplier.findMany();
  let migratedCount = 0;

  for (const supplier of suppliers) {
    if (supplier.accountNumber && supplier.accountNumber.includes(' - ')) {
      const parts = supplier.accountNumber.split(' - ');
      const bankName = parts[0].trim();
      const accountNumber = parts.slice(1).join(' - ').trim();

      await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          bankName,
          accountNumber
        }
      });
      migratedCount++;
      console.log(`Migrated supplier ${supplier.name}: ${bankName} / ${accountNumber}`);
    } else if (supplier.accountNumber) {
        // Some might be just numbers or words without hyphen, let's leave them as account numbers for now
        // or check if it starts with BCA/BNI/BRI etc.
        const knownBanks = ["BCA", "BNI", "BRI", "MANDIRI", "BSI", "BJB", "CIMB", "PERMATA"];
        const parts = supplier.accountNumber.split(' ');
        if (parts.length > 1 && knownBanks.includes(parts[0].toUpperCase())) {
            const bankName = parts[0];
            const accountNumber = parts.slice(1).join(' ').trim();
            await prisma.supplier.update({
                where: { id: supplier.id },
                data: { bankName, accountNumber }
            });
            migratedCount++;
            console.log(`Migrated supplier ${supplier.name}: ${bankName} / ${accountNumber}`);
        }
    }
  }

  console.log(`Migration completed. Migrated ${migratedCount} suppliers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
