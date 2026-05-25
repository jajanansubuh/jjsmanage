import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const userRole = session?.user?.role?.toUpperCase();

    if (userRole === "SUPPLIER") {
      const supplierId = session.user.supplierId;
      if (!supplierId) {
        return NextResponse.json({ error: "ID Supplier tidak ditemukan dalam sesi" }, { status: 400 });
      }

      const aggregate = await prisma.consignmentReport.aggregate({
        where: { supplierId },
        _sum: {
          barcode: true,
          serviceCharge: true,
          kukuluban: true
        }
      });

      const history = await prisma.consignmentReport.findMany({
        where: {
          supplierId,
          OR: [
            { barcode: { gt: 0 } },
            { serviceCharge: { gt: 0 } },
            { kukuluban: { gt: 0 } }
          ]
        },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          barcode: true,
          serviceCharge: true,
          kukuluban: true,
          noteNumber: true,
          revenue: true,
          profit80: true
        }
      });

      const mappedHistory = history.map(item => ({
        id: item.id,
        date: item.date,
        barcode: Number(item.barcode || 0),
        serviceCharge: Number(item.serviceCharge || 0),
        kukuluban: Number(item.kukuluban || 0),
        noteNumber: item.noteNumber,
        revenue: Number(item.revenue || 0),
        profit80: Number(item.profit80 || 0),
      }));

      return NextResponse.json({
        totalBarcode: Number(aggregate._sum.barcode || 0),
        totalServiceCharge: Number(aggregate._sum.serviceCharge || 0),
        totalKukuluban: Number(aggregate._sum.kukuluban || 0),
        totalDeduction: Number(aggregate._sum.barcode || 0) + Number(aggregate._sum.serviceCharge || 0) + Number(aggregate._sum.kukuluban || 0),
        history: mappedHistory
      });
    } else {
      const deductionsBySupplier = await prisma.consignmentReport.groupBy({
        by: ['supplierId'],
        _sum: {
          barcode: true,
          serviceCharge: true,
          kukuluban: true
        },
        where: {
          OR: [
            { barcode: { gt: 0 } },
            { serviceCharge: { gt: 0 } },
            { kukuluban: { gt: 0 } }
          ]
        }
      });

      const suppliers = await prisma.supplier.findMany({
        where: {
          id: { in: deductionsBySupplier.map(d => d.supplierId) }
        },
        select: {
          id: true,
          name: true,
          ownerName: true
        }
      });

      const result = deductionsBySupplier.map(data => {
        const supplier = suppliers.find(s => s.id === data.supplierId);
        const barcode = Number(data._sum.barcode || 0);
        const serviceCharge = Number(data._sum.serviceCharge || 0);
        const kukuluban = Number(data._sum.kukuluban || 0);
        return {
          id: data.supplierId,
          name: supplier?.name || "Unknown",
          ownerName: supplier?.ownerName || "-",
          totalBarcode: barcode,
          totalServiceCharge: serviceCharge,
          totalKukuluban: kukuluban,
          totalDeduction: barcode + serviceCharge + kukuluban
        };
      }).sort((a, b) => b.totalDeduction - a.totalDeduction);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Failed to fetch deductions summary:", error);
    return NextResponse.json({ error: "Failed to fetch deductions summary" }, { status: 500 });
  }
}
