import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
// Refresh schema context

type ReportWithSupplier = Prisma.ConsignmentReportGetPayload<{ include: { supplier: true } }>;

// Helper: Normalize product name
const normalizeProductName = (val: string | null | undefined) =>
  String(val || "")
    .trim()
    .toUpperCase()
    .replace(/[.,\s]+$/, "")
    .replace(/\s+/g, " ");

// Helper: Auto-sync products from report items to Product master
async function syncProductsFromReportItems(
  tx: Prisma.TransactionClient,
  supplierId: string,
  items: any[]
) {
  if (!Array.isArray(items) || items.length === 0) return;

  const productNames = new Set<string>();
  items.forEach((item: any) => {
    const name = String(item.name || "").trim();
    if (name) {
      productNames.add(normalizeProductName(name));
    }
  });

  // For each product name, ensure it exists in Product master
  for (const name of productNames) {
    if (!name) continue;

    const existing = await tx.product.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        supplierId,
      },
    });

    if (!existing) {
      await tx.product.create({
        data: {
          name,
          supplierId,
        },
      });
    }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let date = searchParams.get('date');
    const noteNumber = searchParams.get('noteNumber');
    let supplierId = searchParams.get('supplierId');
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    const deductionNoteNumber = searchParams.get('deductionNoteNumber');
    
    // Check session for Role Based Access
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    
    if (session?.user?.role?.toUpperCase() === "SUPPLIER") {
      supplierId = session.user.supplierId || "INVALID_SUPPLIER_ID"; // Force their own supplierId
      date = null;
      startDate = null;
      endDate = null;
    }

    const whereClause: Prisma.ConsignmentReportWhereInput = {};
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

    const formattedReports = (reports as ReportWithSupplier[]).map((r) => ({
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
        balance: Number((r.supplier as any).balance),
        validatedBalance: Number((r.supplier as any).validatedBalance)
      } : undefined
    }));

    return NextResponse.json({
      reports: formattedReports,
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
    const data = (await req.json()) as unknown;
    
    // Support single or multiple reports
    if (Array.isArray(data)) {
      const payloads = data as Array<Record<string, unknown>>;
      const result = await prisma.$transaction(async (tx) => {
        // 1. Sync products from all report items to Product master
        for (const r of payloads) {
          await syncProductsFromReportItems(tx, String(r.supplierId), (r as any).items || []);
        }

        // 2. Batch create all reports concurrently
        const reports = await Promise.all(
          payloads.map((r) => tx.consignmentReport.create({
            data: {
              supplierId: String(r.supplierId),
              noteNumber: r.noteNumber ? String(r.noteNumber) : null,
              date: r.date ? new Date(String(r.date)) : new Date(),
              revenue: Number((r as any).revenue) || 0,
              profit80: Number((r as any).profit80) || 0,
              profit20: Number((r as any).profit20) || 0,
              barcode: Number((r as any).barcode) || 0,
              cost: Number((r as any).cost) || 0,
              serviceCharge: Number((r as any).serviceCharge) || 0,
              kukuluban: Number((r as any).kukuluban) || 0,
              tabungan: Number((r as any).tabungan) || 0,
              notes: r.notes ? String(r.notes) : null,
              items: (r as any).items || [],
            }
          }))
        );
        
        // 3. Aggregate balance increments per supplier (reduces DB calls)
        const balanceMap = new Map<string, number>();
        for (const r of payloads) {
          const supplierId = String(r.supplierId);
          const profit = Number((r as any).profit80) || 0;
          balanceMap.set(supplierId, (balanceMap.get(supplierId) || 0) + profit);
        }
        
        // 4. Update supplier balances concurrently
        await Promise.all(
          Array.from(balanceMap.entries()).map(([supplierId, totalProfit]) => 
            tx.supplier.update({
              where: { id: supplierId },
              data: { balance: { increment: totalProfit } }
            })
          )
        );
        
        return reports;
      }, {
        maxWait: 10000,
        timeout: 120000, // 120 seconds timeout for large batches
      });
      return NextResponse.json(result);
    } else {
      const payload = data as Record<string, unknown>;
      const result = await prisma.$transaction(async (tx) => {
        // 1. Sync products from report items to Product master
        await syncProductsFromReportItems(tx, String(payload.supplierId), (payload as any).items || []);

        // 2. Create report
        const report = await tx.consignmentReport.create({
          data: {
            supplierId: String(payload.supplierId),
            noteNumber: payload.noteNumber ? String(payload.noteNumber) : null,
            date: payload.date ? new Date(String(payload.date)) : new Date(),
            revenue: Number((payload as any).revenue) || 0,
            profit80: Number((payload as any).profit80) || 0,
            profit20: Number((payload as any).profit20) || 0,
            barcode: Number((payload as any).barcode) || 0,
            cost: Number((payload as any).cost) || 0,
            serviceCharge: Number((payload as any).serviceCharge) || 0,
            kukuluban: Number((payload as any).kukuluban) || 0,
            tabungan: Number((payload as any).tabungan) || 0,
            notes: payload.notes ? String(payload.notes) : null,
            items: (payload as any).items || [],
          },
        });

        // 3. Update supplier balance
        await tx.supplier.update({
          where: { id: String(payload.supplierId) },
          data: { balance: { increment: Number((payload as any).profit80) || 0 } }
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
