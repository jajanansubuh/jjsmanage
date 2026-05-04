"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { saveTransactionSchema, SaveTransactionData } from "@/lib/validations/transaction";

export async function saveTransactionAction(rawData: any) {
  try {
    // 1. Zod Validation
    const validationResult = saveTransactionSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((err: any) => err.message).join(", ");
      return { error: "Validasi gagal", details: errorMessages };
    }

    const data: SaveTransactionData = validationResult.data;

    const validRows = data.rows.filter(
      (r) => r.supplierId && (r.revenue > 0 || r.cost > 0 || r.barcode > 0)
    );

    if (validRows.length === 0) {
      return { error: "Tidak ada data transaksi untuk disimpan" };
    }

    // Verify all suppliers exist
    const supplierIds = validRows.map((r) => r.supplierId);
    const existingSuppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true },
    });

    if (existingSuppliers.length !== new Set(supplierIds).size) {
      return { error: "Beberapa suplier tidak valid atau tidak ditemukan di database." };
    }

    const targetDate = data.date ? new Date(data.date) : new Date();

    await prisma.$transaction(
      async (tx) => {
        // 1. If edit mode, delete old records and reverse balances
        if (data.isEditMode && data.editNoteNumber) {
          const oldReports = await tx.consignmentReport.findMany({
            where: { noteNumber: data.editNoteNumber },
          });

          if (oldReports.length > 0) {
            const oldBalanceMap = new Map<string, number>();
            for (const report of oldReports) {
              oldBalanceMap.set(
                report.supplierId,
                (oldBalanceMap.get(report.supplierId) || 0) + report.profit80
              );
            }

            for (const [supplierId, totalProfit] of oldBalanceMap) {
              await tx.supplier.update({
                where: { id: supplierId },
                data: { balance: { decrement: totalProfit } },
              });
            }

            await tx.consignmentReport.deleteMany({
              where: { noteNumber: data.editNoteNumber },
            });
          }
        }

        // 2. Insert new records
        for (const r of validRows) {
          await tx.consignmentReport.create({
            data: {
              supplierId: r.supplierId,
              noteNumber: data.noteNumber,
              date: targetDate,
              revenue: Number(r.revenue) || 0,
              profit80: Number(r.profit80) || 0,
              profit20: Number(r.profit20) || 0,
              barcode: Number(r.barcode) || 0,
              cost: Number(r.cost) || 0,
              serviceCharge: Number(r.serviceCharge) || 0,
              kukuluban: Number(r.kukuluban) || 0,
              tabungan: Number(r.tabungan) || 0,
              notes: data.notes || null,
            },
          });
        }

        // 3. Update new balances
        const newBalanceMap = new Map<string, number>();
        for (const r of validRows) {
          const profit = Number(r.profit80) || 0;
          newBalanceMap.set(
            r.supplierId,
            (newBalanceMap.get(r.supplierId) || 0) + profit
          );
        }

        for (const [supplierId, totalProfit] of newBalanceMap) {
          await tx.supplier.update({
            where: { id: supplierId },
            data: { balance: { increment: totalProfit } },
          });
        }
      },
      {
        timeout: 30000,
      }
    );

    revalidatePath("/transactions");
    revalidatePath("/reports");
    revalidatePath("/master");
    revalidatePath("/");

    return { success: true, noteNumber: data.noteNumber };
  } catch (error) {
    console.error("saveTransactionAction error:", error);
    return {
      error: "Gagal menyimpan transaksi",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
