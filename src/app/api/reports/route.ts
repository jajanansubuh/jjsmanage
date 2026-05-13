import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Refresh schema context

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const noteNumber = searchParams.get('noteNumber');
    let supplierId = searchParams.get('supplierId');
    
    // Check session for Role Based Access
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    
    if (session?.user?.role?.toUpperCase() === "SUPPLIER") {
      supplierId = session.user.supplierId || "INVALID_SUPPLIER_ID"; // Force their own supplierId
    }
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const deductionNoteNumber = searchParams.get('deductionNoteNumber');

    const whereClause: any = {};
    if (supplierId) whereClause.supplierId = supplierId;
    if (noteNumber) whereClause.noteNumber = noteNumber;
    if (deductionNoteNumber) whereClause.deductionNoteNumber = deductionNoteNumber;

    if (date || (startDate && endDate)) {
      const start = new Date(startDate || date!);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate || date!);
      end.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: start,
        lte: end
      };
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Increased to 1000 to avoid cutting off data
    const skip = (page - 1) * limit;


    const [reports, total] = await Promise.all([
      prisma.consignmentReport.findMany({
        where: whereClause,
        include: { supplier: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.consignmentReport.count({ where: whereClause })
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
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
        // 1. Batch create all reports
        const reports = [];
        for (const r of data) {
          const report = await tx.consignmentReport.create({
            data: {
              supplierId: r.supplierId,
              noteNumber: r.noteNumber || null,
              date: r.date ? new Date(r.date) : new Date(),
              revenue: Number(r.revenue) || 0,
              profit80: Number(r.profit80) || 0,
              profit20: Number(r.profit20) || 0,
              barcode: Number(r.barcode) || 0,
              cost: Number(r.cost) || 0,
              serviceCharge: Number(r.serviceCharge) || 0,
              kukuluban: Number(r.kukuluban) || 0,
              tabungan: Number(r.tabungan) || 0,
              notes: r.notes || null,
              items: r.items || [],
            },
          });
          reports.push(report);
        }
        
        // 2. Aggregate balance increments per supplier (reduces DB calls)
        const balanceMap = new Map<string, number>();
        for (const r of data) {
          const profit = Number(r.profit80) || 0;
          balanceMap.set(r.supplierId, (balanceMap.get(r.supplierId) || 0) + profit);
        }
        
        // 3. Update supplier balances (one query per unique supplier)
        for (const [supplierId, totalProfit] of balanceMap) {
          await tx.supplier.update({
            where: { id: supplierId },
            data: { balance: { increment: totalProfit } }
          });
        }
        
        return reports;
      }, {
        timeout: 30000, // 30 seconds timeout for large batches
      });
      return NextResponse.json(result);
    } else {
      const result = await prisma.$transaction(async (tx) => {
        const report = await tx.consignmentReport.create({
          data: {
            supplierId: data.supplierId,
            noteNumber: data.noteNumber || null,
            date: data.date ? new Date(data.date) : new Date(),
            revenue: Number(data.revenue) || 0,
            profit80: Number(data.profit80) || 0,
            profit20: Number(data.profit20) || 0,
            barcode: Number(data.barcode) || 0,
            cost: Number(data.cost) || 0,
            serviceCharge: Number(data.serviceCharge) || 0,
            kukuluban: Number(data.kukuluban) || 0,
            tabungan: Number(data.tabungan) || 0,
            notes: data.notes || null,
            items: data.items || [],
          },
        });

        // Update supplier balance
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { balance: { increment: Number(data.profit80) || 0 } }
        });

        return report;
      }, {
        timeout: 30000,
      });
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("POST /api/reports error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Check for common Prisma errors
    if (errorMessage.includes("Foreign key constraint")) {
      return NextResponse.json({ 
        error: "Suplier tidak valid", 
        details: "Salah satu supplierId tidak ditemukan di database. Pastikan suplier masih ada." 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      error: "Failed to save report", 
      details: errorMessage
    }, { status: 500 });
  }
}
