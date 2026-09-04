import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";
// Trigger re-eval with updated Prisma schema
export async function POST(req: Request) {
  try {
    const { session, response } = await requireAuth();
    if (response) return response;

    const body = await req.json();
    const data: {
      supplierId: string;
      startDate: string;
      endDate: string;
      tabungan: number;
      savingsDate?: string;
      savingsNoteNumber?: string;
    }[] = body.data;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Data tabungan kosong" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of data) {
        // 1. Find all reports for this supplier in the range
        const start = new Date(item.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(item.endDate);
        end.setHours(23, 59, 59, 999);

        const reports = await tx.consignmentReport.findMany({
          where: {
            supplierId: item.supplierId,
            OR: [
              ...(item.savingsNoteNumber ? [{ savingsNoteNumber: item.savingsNoteNumber }] : []),
              {
                date: {
                  gte: start,
                  lte: end
                }
              }
            ]
          },
          orderBy: { date: 'asc' }
        });

        if (reports.length === 0) continue;

        // 2. Aggregate savings and calculate total adjustment for the supplier
        let totalAdjustment = 0;
        let totalValidatedAdjustment = 0;

        for (let i = 0; i < reports.length; i++) {
          const report = reports[i];
          const isFirst = i === 0;

          // Preserve existing service charge and kukuluban
          const sc = Number(report.serviceCharge || 0);
          const kukuluban = Number(report.kukuluban || 0);
          const tabungan = isFirst ? (item.tabungan ?? Number(report.tabungan || 0)) : 0;

          // New Profit80 calculation for this specific report
          const cost = Number(report.cost);
          const barcode = Number(report.barcode);
          const oldProfit80 = Number(report.profit80);
          
          const newProfit80 = cost - (barcode + sc + kukuluban + tabungan);
          const adjustment = newProfit80 - oldProfit80;
          totalAdjustment += adjustment;
          if (report.isValidated) {
            totalValidatedAdjustment += adjustment;
          }

          // Update this report
          await tx.consignmentReport.update({
            where: { id: report.id },
            data: {
              tabungan: tabungan,
              profit80: newProfit80,
              savingsDate: item.savingsDate ? new Date(item.savingsDate) : null,
              savingsNoteNumber: item.savingsNoteNumber || null,
            }
          });
        }

        // 3. Update supplier balance ONCE per supplier (Efficiency)
        if (totalAdjustment !== 0 || totalValidatedAdjustment !== 0) {
          const supplierDataToUpdate: any = {};
          if (totalAdjustment !== 0) {
            supplierDataToUpdate.balance = { increment: totalAdjustment };
          }
          if (totalValidatedAdjustment !== 0) {
            supplierDataToUpdate.validatedBalance = { increment: totalValidatedAdjustment };
          }
          await tx.supplier.update({
            where: { id: item.supplierId },
            data: supplierDataToUpdate
          });
        }
      }
    }, {
      timeout: 60000 // 60 seconds timeout
    });

    revalidatePath("/savings");
    revalidatePath("/potongan");
    revalidatePath("/reports");
    revalidatePath("/master");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/savings/save error:", error);
    return NextResponse.json({
      error: "Gagal memperbarui tabungan",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
