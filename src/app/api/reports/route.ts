import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const reports = await prisma.consignmentReport.findMany({
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Support single or multiple reports
    if (Array.isArray(data)) {
      const result = await prisma.$transaction(async (tx) => {
        const reports = [];
        for (const r of data) {
          const report = await tx.consignmentReport.create({
            data: {
              supplierId: r.supplierId,
              revenue: parseFloat(r.revenue),
              profit80: parseFloat(r.profit80),
              profit20: parseFloat(r.profit20),
              barcode: parseFloat(r.barcode),
              cost: parseFloat(r.cost),
            },
          });
          
          // Update supplier balance
          await tx.supplier.update({
            where: { id: r.supplierId },
            data: { balance: { increment: parseFloat(r.profit80) } }
          });
          
          reports.push(report);
        }
        return reports;
      });
      return NextResponse.json(result);
    } else {
      const result = await prisma.$transaction(async (tx) => {
        const report = await tx.consignmentReport.create({
          data: {
            supplierId: data.supplierId,
            revenue: parseFloat(data.revenue),
            profit80: parseFloat(data.profit80),
            profit20: parseFloat(data.profit20),
            barcode: parseFloat(data.barcode),
            cost: parseFloat(data.cost),
          },
        });

        // Update supplier balance
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { balance: { increment: parseFloat(data.profit80) } }
        });

        return report;
      });
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
