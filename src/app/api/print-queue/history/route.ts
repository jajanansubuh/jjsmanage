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

    if (from || to) {
      where.completedAt = {};
      if (from) where.completedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.completedAt.lte = toDate;
      }
    } else {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      where.completedAt = { gte: startOfYesterday };
    }

    if (session.user.role === "SUPPLIER") {
      where.supplierId = session.user.supplierId || "INVALID";
    } else if (supplierId) {
      where.supplierId = supplierId;
    }

    const history = await prisma.labelPrintHistory.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 200,
    });

    return NextResponse.json(history, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  } catch (error: unknown) {
    console.error("GET /api/print-queue/history error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
