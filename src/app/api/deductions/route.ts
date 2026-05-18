import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    let supplierId = undefined;
    
    if (session?.user?.role?.toUpperCase() === "SUPPLIER") {
      supplierId = session.user.supplierId || "INVALID_SUPPLIER_ID";
    }

    const whereClause: any = {
      OR: [
        { serviceCharge: { gt: 0 } },
        { kukuluban: { gt: 0 } },
        { tabungan: { gt: 0 } },
        { deductionNoteNumber: { not: null } }
      ]
    };

    if (supplierId) {
      whereClause.supplierId = supplierId;
    }

    const reports = await prisma.consignmentReport.findMany({
      where: whereClause,
      include: { supplier: true },
      orderBy: { deductionDate: "desc" },
    });

    const formattedReports = reports.map((r: any) => ({
      ...r,
      revenue: Number(r.revenue),
      profit80: Number(r.profit80),
      profit20: Number(r.profit20),
      barcode: Number(r.barcode),
      cost: Number(r.cost),
      serviceCharge: Number(r.serviceCharge || 0),
      kukuluban: Number(r.kukuluban || 0),
      tabungan: Number(r.tabungan || 0),
      supplier: r.supplier ? {
        ...r.supplier,
        balance: Number(r.supplier.balance),
        validatedBalance: Number(r.supplier.validatedBalance)
      } : undefined
    }));

    return NextResponse.json({
      reports: formattedReports
    });
  } catch (error) {
    console.error("Failed to fetch deductions:", error);
    return NextResponse.json({ error: "Failed to fetch deductions" }, { status: 500 });
  }
}
