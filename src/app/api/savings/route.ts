import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const userRole = session?.user?.role?.toUpperCase();

    if (userRole === "SUPPLIER") {
      const supplierId = session.user.supplierId;
      if (!supplierId) {
        return NextResponse.json({ error: "ID Supplier tidak ditemukan dalam sesi" }, { status: 400 });
      }
      
      // Get savings total for a specific supplier
      const aggregate = await prisma.consignmentReport.aggregate({
        where: { supplierId },
        _sum: {
          tabungan: true
        }
      });

      // Get history of savings deductions
      const history = await prisma.consignmentReport.findMany({
        where: { 
          supplierId,
          tabungan: { gt: 0 }
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
        total: aggregate._sum.tabungan || 0,
        history
      });
    } else {
      // Admin view: get all suppliers with their accumulated savings
      const savingsBySupplier = await prisma.consignmentReport.groupBy({
        by: ['supplierId'],
        _sum: {
          tabungan: true
        },
        where: {
          tabungan: { gt: 0 }
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
          totalSavings: data._sum.tabungan || 0
        };
      }).sort((a, b) => b.totalSavings - a.totalSavings);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Failed to fetch savings:", error);
    return NextResponse.json({ error: "Failed to fetch savings" }, { status: 500 });
  }
}
