import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Preview what would be recovered (dry run)
export async function GET(req: Request) {
  try {
    // const { getSession } = await import("@/lib/auth-utils");
    // const session = await getSession();
    // if (!session || session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Get all DONE items from LabelPrint
    const doneItems = await prisma.labelPrint.findMany({
      where: {
        status: "DONE",
      },
      select: {
        id: true,
        name: true,
        code: true,
        qty: true,
        supplierId: true,
        createdAt: true,
      },
    });

    // 2. Get all history records from the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const existingHistory = await prisma.labelPrintHistory.findMany({
      where: {
        completedAt: { gte: threeDaysAgo },
      },
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
    });

    // 3. Group DONE items by supplier
    const groupedDone = new Map<string, { name: string; code: string | null; qty: number }[]>();
    for (const item of doneItems) {
      if (!groupedDone.has(item.supplierId)) groupedDone.set(item.supplierId, []);
      groupedDone.get(item.supplierId)!.push({ name: item.name, code: item.code, qty: item.qty });
    }

    // 4. Find suppliers with DONE items but NO history record
    const existingSupplierIds = new Set(existingHistory.map(h => h.supplierId));
    const missingSuppliers: { supplierId: string; itemCount: number; totalQty: number }[] = [];

    for (const [supplierId, items] of groupedDone.entries()) {
      if (!existingSupplierIds.has(supplierId)) {
        missingSuppliers.push({
          supplierId,
          itemCount: items.length,
          totalQty: items.reduce((sum, i) => sum + i.qty, 0),
        });
      }
    }

    // 5. Get all PENDING items in the entire database
    const pendingItems = await prisma.labelPrint.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        supplier: { select: { name: true } },
      },
    });

    return NextResponse.json({
      summary: {
        totalDoneItemsInDb: doneItems.length,
        uniqueDoneSuppliers: groupedDone.size,
        historyRecordsLast3Days: existingHistory.length,
        missingHistoryRecords: missingSuppliers.length,
        totalPendingItemsInDb: pendingItems.length,
      },
      pendingItems: pendingItems.map(p => ({
        id: p.id,
        name: p.name,
        qty: p.qty,
        supplierName: p.supplier?.name,
        createdAt: p.createdAt,
      })),
      existingHistory: existingHistory.map(h => ({
        id: h.id,
        supplierName: h.supplier.name,
        supplierId: h.supplierId,
        itemCount: h.itemCount,
        totalQty: h.totalQty,
        completedAt: h.completedAt,
      })),
      missingSuppliers,
      message: missingSuppliers.length > 0
        ? `Ditemukan ${missingSuppliers.length} supplier yang DONE tapi belum punya history. POST ke endpoint ini untuk recovery.`
        : "Semua supplier DONE sudah punya history record. Tidak ada yang perlu di-recover.",
    });
  } catch (error: unknown) {
    console.error("GET /api/print-queue/recover-history error:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}

// POST: Actually perform the recovery
export async function POST(req: Request) {
  try {
    // const { getSession } = await import("@/lib/auth-utils");
    // const session = await getSession();
    // if (!session || session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

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
