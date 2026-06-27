import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only admin or supplier can view history
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const supplierId = searchParams.get("supplierId");

    const where: {
      completedAt?: { gte?: Date; lte?: Date };
      supplierId?: string;
    } = {};

    const pendingWhere: {
      status: string;
      createdAt?: { gte?: Date; lte?: Date };
      supplierId?: string;
    } = {
      status: "PENDING",
    };

    if (from || to) {
      where.completedAt = {};
      pendingWhere.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        where.completedAt.gte = fromDate;
        pendingWhere.createdAt.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.completedAt.lte = toDate;
        pendingWhere.createdAt.lte = toDate;
      }
    } else {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      where.completedAt = { gte: startOfYesterday };
    }

    if (session.user.role === "SUPPLIER") {
      const sId = session.user.supplierId || "INVALID";
      where.supplierId = sId;
      pendingWhere.supplierId = sId;
    } else if (supplierId) {
      where.supplierId = supplierId;
      pendingWhere.supplierId = supplierId;
    }

    // Fetch completed history records
    const history = await prisma.labelPrintHistory.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 200,
    });

    // Fetch pending queue items
    const pendingItems = await prisma.labelPrint.findMany({
      where: pendingWhere,
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group pending items into "pending sessions" (by supplier and createdAt within 5 seconds)
    const pendingSessions: any[] = [];
    
    // Sort pendingItems by createdAt desc
    const sortedPendingItems = [...pendingItems].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Grouping pending items
    let currentSession: any = null;
    for (const item of sortedPendingItems) {
      const itemTime = item.createdAt.getTime();
      if (
        !currentSession ||
        currentSession.supplierId !== item.supplierId ||
        Math.abs(currentSession.time - itemTime) > 5000
      ) {
        currentSession = {
          id: `pending-${item.id}`,
          supplierId: item.supplierId,
          supplier: item.supplier,
          itemCount: 0,
          totalQty: 0,
          items: [],
          completedAt: item.createdAt, // use for sorting
          createdAt: item.createdAt,
          status: "PENDING",
          time: itemTime,
        };
        pendingSessions.push(currentSession);
      }
      currentSession.items.push({
        name: item.name,
        code: item.code,
        qty: item.qty,
      });
      currentSession.itemCount += 1;
      currentSession.totalQty += item.qty;
    }

    // Map completed history records to have status "DONE"
    const formattedHistory = history.map((h) => ({
      ...h,
      status: "DONE",
    }));

    // Combine and sort
    const combined = session.user.role === "ADMIN" ? formattedHistory : [...pendingSessions, ...formattedHistory];
    combined.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    return NextResponse.json(combined, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  } catch (error: unknown) {
    console.error("GET /api/print-queue/history error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

