import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  const defaultSetting = await prisma.maintenanceSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      enabled: false,
      message: "System is under maintenance.",
      estimatedFinish: null,
      updatedBy: "SYSTEM",
    },
  });

  console.log("Database seeded successfully:", defaultSetting);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
