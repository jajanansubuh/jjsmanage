import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";
    
    const where: { status?: string; supplierId?: string } = {};
    if (status !== "ALL") {
      where.status = status;
    }
    
    if (session.user.role === "SUPPLIER") {
      where.supplierId = session.user.supplierId || "INVALID";
    }

    const items = await prisma.labelPrint.findMany({
      where,
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  } catch (error: unknown) {
    console.error("GET /api/print-queue error:", error);
    return NextResponse.json({ error: "Failed to fetch print queue" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await req.json(); // Array of { name, code, qty, supplierId? }
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const supplierId = session.user.supplierId;
    
    // Use transaction to save all items
    const result = await prisma.$transaction(
      items.map((item: { name: string; code?: string; qty: number; supplierId?: string }) => {
        const finalSupplierId = supplierId || item.supplierId;
        if (!finalSupplierId) {
          throw new Error(`Produk "${item.name}" tidak memiliki data suplier.`);
        }
        return prisma.labelPrint.create({
          data: {
            name: item.name,
            code: item.code || null,
            qty: item.qty || 1,
            supplierId: finalSupplierId,
          }
        });
      })
    );

    return NextResponse.json({ message: "Saved to queue", count: result.length });
  } catch (error: any) {
    console.error("POST /api/print-queue error:", error);
    return NextResponse.json({ 
      error: "Gagal menyimpan antrean", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, qty, all } = await req.json();
    
    if (all) {
      const sqlSupplierId = session.user.role === "SUPPLIER" ? (session.user.supplierId || "INVALID") : null;

      const updatedCount = await prisma.$transaction(async (tx) => {
        // Fetch the pending items using standard Prisma client
        const pendingItems = await tx.labelPrint.findMany({
          where: {
            status: "PENDING",
            ...(sqlSupplierId ? { supplierId: sqlSupplierId } : {})
          },
          select: {
            id: true,
            name: true,
            code: true,
            qty: true,
            supplierId: true,
          }
        });

        if (pendingItems.length === 0) {
          return 0;
        }

        // Update status of these specific items
        const updateResult = await tx.labelPrint.updateMany({
          where: {
            id: { in: pendingItems.map(item => item.id) }
          },
          data: { status: "DONE" }
        });

        // Group history records by supplier
        const grouped = new Map<string, { name: string; code: string | null; qty: number }[]>();
        for (const item of pendingItems) {
          const sid = item.supplierId;
          if (!grouped.has(sid)) grouped.set(sid, []);
          grouped.get(sid)!.push({ name: item.name, code: item.code, qty: item.qty });
        }

        // Create ALL history records in a single batch insert (critical for 70+ suppliers)
        const historyData = Array.from(grouped.entries()).map(([supplierId, items]) => ({
          supplierId,
          itemCount: items.length,
          totalQty: items.reduce((sum, i) => sum + i.qty, 0),
          items: items as any,
        }));

        await tx.labelPrintHistory.createMany({
          data: historyData,
        });

        return updateResult.count;
      }, {
        timeout: 30000, // 30 seconds timeout for large batches (70+ suppliers)
      });

      // Auto-cleanup old items asynchronously without blocking the response
      if (updatedCount > 0) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        prisma.labelPrint.deleteMany({
          where: {
            status: "DONE",
            createdAt: { lt: startOfToday }
          }
        }).catch((cleanupErr) => {
          console.error("Auto-cleanup labelPrint error in PUT:", cleanupErr);
        });

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        prisma.labelPrintHistory.deleteMany({
          where: {
            completedAt: { lt: startOfYesterday }
          }
        }).catch((cleanupErr) => {
          console.error("Auto-cleanup labelPrintHistory error in PUT:", cleanupErr);
        });
      }

      return NextResponse.json({ message: "All items marked as done", count: updatedCount });
    }
    
    // Single item update
    if (status === "DONE") {
      const updatedItem = await prisma.$transaction(async (tx) => {
        // Fetch single item using standard Prisma client
        const item = await tx.labelPrint.findUnique({
          where: { id }
        });

        if (!item || item.status !== "PENDING") {
          return null;
        }

        // Update the item status
        const updated = await tx.labelPrint.update({
          where: { id },
          data: { status: "DONE" }
        });

        // Create the history record
        await tx.labelPrintHistory.create({
          data: {
            supplierId: item.supplierId,
            itemCount: 1,
            totalQty: item.qty,
            items: [{ name: item.name, code: item.code, qty: item.qty }] as any,
          }
        });

        return updated;
      });

      // Trigger auto-cleanup asynchronously if updated
      if (updatedItem) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        prisma.labelPrint.deleteMany({
          where: {
            status: "DONE",
            createdAt: { lt: startOfToday }
          }
        }).catch((cleanupErr) => {
          console.error("Auto-cleanup labelPrint error in PUT:", cleanupErr);
        });

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        prisma.labelPrintHistory.deleteMany({
          where: {
            completedAt: { lt: startOfYesterday }
          }
        }).catch((cleanupErr) => {
          console.error("Auto-cleanup labelPrintHistory error in PUT:", cleanupErr);
        });
      }

      return NextResponse.json({ message: "Marked as done and recorded in history" });
    }

    const updated = await prisma.labelPrint.update({
      where: { id },
      data: { 
        ...(status && { status }),
        ...(qty !== undefined && { qty: parseInt(qty) })
      }
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PUT /api/print-queue error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, all } = await req.json();
    
    if (all) {
      const where: { status: string; supplierId?: string } = { status: "PENDING" };
      if (session.user.role === "SUPPLIER") {
        where.supplierId = session.user.supplierId || "INVALID";
      }
      await prisma.labelPrint.deleteMany({ where });
    } else {
      await prisma.labelPrint.delete({ where: { id } });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/print-queue error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
