import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const { session, response } = await requireAuth();
    if (response) return response;

    const body = await req.json();
    const data: {
      supplierId: string;
      startDate: string;
      endDate: string;
      serviceCharge: number;
      kukuluban: number;
      tabungan: number;
      deductionDate?: string;
      deductionNoteNumber?: string;
    }[] = body.data;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Data potongan kosong" }, { status: 400 });
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
            date: {
              gte: start,
              lte: end
            }
          },
          orderBy: { date: 'asc' }
        });

        if (reports.length === 0) continue;

        // 2. Aggregate deductions and calculate total adjustment for the supplier
        let totalAdjustment = 0;
        let totalValidatedAdjustment = 0;

        for (let i = 0; i < reports.length; i++) {
          const report = reports[i];
          const isFirst = i === 0;

          const sc = isFirst ? item.serviceCharge : 0;
          const kukuluban = isFirst ? item.kukuluban : 0;
          const tabungan = isFirst ? item.tabungan : 0;

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
              serviceCharge: sc,
              kukuluban: kukuluban,
              tabungan: tabungan,
              profit80: newProfit80,
              deductionDate: item.deductionDate ? new Date(item.deductionDate) : null,
              deductionNoteNumber: item.deductionNoteNumber || null
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
      timeout: 60000 // 60 seconds timeout for potentially large batch updates
    });

    revalidatePath("/potongan");
    revalidatePath("/reports");
    revalidatePath("/master");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/deductions/save error:", error);
    return NextResponse.json({
      error: "Gagal memperbarui potongan",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
