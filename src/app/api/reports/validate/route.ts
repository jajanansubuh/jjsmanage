import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { supplierId, startDate, endDate } = await req.json();

    if (!supplierId) {
      return NextResponse.json({ error: "Missing supplierId" }, { status: 400 });
    }

    let dateFilter: any = undefined;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = {
        gte: start,
        lte: end,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find all unvalidated reports
      const whereClause: any = {
        supplierId,
        isValidated: false,
      };
      if (dateFilter) {
        whereClause.date = dateFilter;
      }

      const reports = await tx.consignmentReport.findMany({
        where: whereClause,
      });

      if (reports.length === 0) {
        return { count: 0, totalProfit: 0 };
      }

      const totalProfit = reports.reduce((sum, r) => sum + (r.profit80 || 0), 0);

      // Update reports to validated
      await tx.consignmentReport.updateMany({
        where: {
          id: { in: reports.map((r) => r.id) },
        },
        data: {
          isValidated: true,
        },
      });

      // Increment validatedBalance
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          validatedBalance: { increment: totalProfit },
        },
      });

      return { count: reports.length, totalProfit };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/reports/validate error:", error);
    return NextResponse.json({ error: "Failed to validate reports" }, { status: 500 });
  }
}
