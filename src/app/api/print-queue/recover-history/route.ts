import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

// GET: Preview what would be recovered (dry run)
export async function GET(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Get all history records from the last 48 hours
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    const history = await prisma.labelPrintHistory.findMany({
      where: {
        completedAt: { gte: fortyEightHoursAgo },
      },
      select: {
        completedAt: true,
        supplier: { select: { name: true } },
      },
    });

    // Group by hour in WIB (UTC+7)
    const hourlyGroups: Record<string, { count: number; suppliers: string[] }> = {};
    for (const h of history) {
      // Convert to WIB
      const wibTime = new Date(h.completedAt.getTime() + 7 * 60 * 60 * 1000);
      const key = format(wibTime, "yyyy-MM-dd HH:00") + " WIB";
      if (!hourlyGroups[key]) {
        hourlyGroups[key] = { count: 0, suppliers: [] };
      }
      hourlyGroups[key].count++;
      hourlyGroups[key].suppliers.push(h.supplier.name);
    }

    // Also count total labelPrint items in DB by status
    const pendingCount = await prisma.labelPrint.count({ where: { status: "PENDING" } });
    const doneCount = await prisma.labelPrint.count({ where: { status: "DONE" } });
    const supplierCount = await prisma.supplier.count();

    return NextResponse.json({
      totalPendingInDb: pendingCount,
      totalDoneInDb: doneCount,
      totalSuppliersInDb: supplierCount,
      hourlyHistoryWIB: hourlyGroups,
    });
  } catch (error: unknown) {
    console.error("GET /api/print-queue/recover-history error:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}

// POST: Actually perform the recovery
export async function POST(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Get all DONE items from LabelPrint created today
    const doneItems = await prisma.labelPrint.findMany({
      where: {
        status: "DONE",
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
      select: {
        id: true,
        name: true,
        code: true,
        qty: true,
        supplierId: true,
      },
    });

    // 2. Get existing history supplier IDs for today
    const existingHistory = await prisma.labelPrintHistory.findMany({
      where: {
        completedAt: { gte: startOfToday, lte: endOfToday },
      },
      select: { supplierId: true },
    });
    const existingSupplierIds = new Set(existingHistory.map(h => h.supplierId));

    // 3. Group DONE items by supplier, only for suppliers WITHOUT existing history
    const grouped = new Map<string, { name: string; code: string | null; qty: number }[]>();
    for (const item of doneItems) {
      if (existingSupplierIds.has(item.supplierId)) continue; // skip already recorded
      if (!grouped.has(item.supplierId)) grouped.set(item.supplierId, []);
      grouped.get(item.supplierId)!.push({ name: item.name, code: item.code, qty: item.qty });
    }

    if (grouped.size === 0) {
      return NextResponse.json({
        message: "Tidak ada history yang perlu di-recover. Semua supplier sudah tercatat.",
        recoveredCount: 0,
      });
    }

    // 4. Create missing history records in a single batch
    const historyData = Array.from(grouped.entries()).map(([supplierId, items]) => ({
      supplierId,
      itemCount: items.length,
      totalQty: items.reduce((sum, i) => sum + i.qty, 0),
      items: items as any,
    }));

    const result = await prisma.labelPrintHistory.createMany({
      data: historyData,
    });

    return NextResponse.json({
      message: `Berhasil recover ${result.count} history record dari supplier yang belum tercatat.`,
      recoveredCount: result.count,
      totalHistoryNow: existingHistory.length + result.count,
    });
  } catch (error: unknown) {
    console.error("POST /api/print-queue/recover-history error:", error);
    return NextResponse.json({ error: "Recovery failed", details: String(error) }, { status: 500 });
  }
}
