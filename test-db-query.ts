import dotenv from "dotenv";
dotenv.config();
import prisma from "./src/lib/prisma";

async function main() {
  console.log("=== CHECKING PRISMA DATABASE STATS ===");
  try {
    const queueCount = await prisma.labelPrint.count();
    const historyCount = await prisma.labelPrintHistory.count();
    console.log(`Queue items count: ${queueCount}`);
    console.log(`History items count: ${historyCount}`);

    const latestQueue = await prisma.labelPrint.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { name: true } } }
    });
    console.log("\n--- LATEST QUEUE ITEMS (Max 5) ---");
    console.log(JSON.stringify(latestQueue, null, 2));

    const latestHistory = await prisma.labelPrintHistory.findMany({
      take: 5,
      orderBy: { completedAt: "desc" },
      include: { supplier: { select: { name: true } } }
    });
    console.log("\n--- LATEST HISTORY ITEMS (Max 5) ---");
    console.log(JSON.stringify(latestHistory, null, 2));

  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    process.exit(0);
  }
}

main();
