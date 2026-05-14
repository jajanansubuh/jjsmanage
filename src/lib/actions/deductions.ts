"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateDeductionsAction(data: { id: string, serviceCharge: number, kukuluban: number, tabungan: number }[]) {
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of data) {
        // Get old report to calculate balance adjustment
        const oldReport = await tx.consignmentReport.findUnique({
          where: { id: item.id },
          select: { profit80: true, supplierId: true, cost: true, barcode: true }
        });

        if (!oldReport) continue;

        // Calculate new profit80
        // New Profit80 = Cost - (Barcode + SC + Kukuluban + Tabungan)
        const cost = Number(oldReport.cost);
        const barcode = Number(oldReport.barcode);
        const oldProfit80 = Number(oldReport.profit80);
        
        const newProfit80 = cost - (barcode + item.serviceCharge + item.kukuluban + item.tabungan);

        // Adjustment to supplier balance
        const adjustment = newProfit80 - oldProfit80;

        // Update report
        await tx.consignmentReport.update({
          where: { id: item.id },
          data: {
            serviceCharge: item.serviceCharge,
            kukuluban: item.kukuluban,
            tabungan: item.tabungan,
            profit80: newProfit80
          }
        });

        // Update supplier balance
        if (adjustment !== 0) {
          await tx.supplier.update({
            where: { id: oldReport.supplierId },
            data: {
              balance: { increment: adjustment }
            }
          });
        }
      }
    }, {
      timeout: 30000
    });

    revalidatePath("/potongan");
    revalidatePath("/reports");
    revalidatePath("/deposits");
    revalidatePath("/savings");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("updateDeductionsAction error:", error);
    return {
      error: "Gagal memperbarui potongan",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function updateAggregatedDeductionsAction(data: {
  supplierId: string,
  startDate: string,
  endDate: string,
  serviceCharge: number,
  kukuluban: number,
  tabungan: number,
  deductionDate?: string,
  deductionNoteNumber?: string
}[]) {
  try {
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

          // Update this report
          await tx.consignmentReport.update({
            where: { id: report.id },
            data: {
              serviceCharge: sc,
              kukuluban: kukuluban,
              tabungan: tabungan,
              profit80: newProfit80,
              // @ts-ignore
              deductionDate: item.deductionDate ? new Date(item.deductionDate) : null,
              // @ts-ignore
              deductionNoteNumber: item.deductionNoteNumber || null
            }
          });
        }

        // 3. Update supplier balance ONCE per supplier (Efficiency)
        if (totalAdjustment !== 0) {
          await tx.supplier.update({
            where: { id: item.supplierId },
            data: {
              balance: { increment: totalAdjustment }
            }
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

    return { success: true };
  } catch (error) {
    console.error("updateAggregatedDeductionsAction error:", error);
    return {
      error: "Gagal memperbarui potongan",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
