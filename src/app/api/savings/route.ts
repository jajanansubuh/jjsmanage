import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const userRole = session?.user?.role?.toUpperCase();

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let dateFilter: any = undefined;
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      dateFilter = {
        gte: start,
        lte: end
      };
    }

    const querySupplierId = searchParams.get("supplierId");
    const targetSupplierId = userRole === "SUPPLIER" ? session?.user?.supplierId : querySupplierId;

    if (targetSupplierId) {
      const supplierInfo = await prisma.supplier.findUnique({
        where: { id: targetSupplierId },
        select: { id: true, name: true, ownerName: true }
      });

      // Get savings total for a specific supplier
      const aggregate = await prisma.consignmentReport.aggregate({
        where: { 
          supplierId: targetSupplierId,
          ...(dateFilter ? { date: dateFilter } : {})
        },
        _sum: {
          tabungan: true
        }
      });

      // Get history of savings deductions
      const history = await prisma.consignmentReport.findMany({
        where: {
          supplierId: targetSupplierId,
          tabungan: { gt: 0 },
          ...(dateFilter ? { date: dateFilter } : {})
        },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          tabungan: true,
          noteNumber: true,
          revenue: true,
          profit80: true
        }
      });

      return NextResponse.json({
        supplier: supplierInfo,
        total: Number(aggregate._sum.tabungan || 0),
        history
      });
    } else {

      const savingsBySupplier = await prisma.consignmentReport.groupBy({
        by: ['supplierId'],
        _sum: {
          tabungan: true
        },
        where: {
          tabungan: { gt: 0 },
          ...(dateFilter ? { date: dateFilter } : {})
        }
      });

      // Get supplier names
      const suppliers = await prisma.supplier.findMany({
        where: {
          id: { in: savingsBySupplier.map(d => d.supplierId) }
        },
        select: {
          id: true,
          name: true,
          ownerName: true
        }
      });

      const result = savingsBySupplier.map(data => {
        const supplier = suppliers.find(s => s.id === data.supplierId);
        return {
          id: data.supplierId,
          name: supplier?.name || "Unknown",
          ownerName: supplier?.ownerName || "-",
          totalSavings: Number(data._sum.tabungan || 0)
        };
      }).sort((a, b) => b.totalSavings - a.totalSavings);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Failed to fetch savings:", error);
    return NextResponse.json({ error: "Failed to fetch savings" }, { status: 500 });
  }
}
