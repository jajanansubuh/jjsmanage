"use server";

import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";

export async function importDatabaseAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "Tidak ada file yang dipilih" };
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    let importedSuppliers = 0;
    let importedCashiers = 0;

    // Process Suppliers
    const supplierSheet = workbook.Sheets["Data Supplier"];
    if (supplierSheet) {
      const suppliersData = XLSX.utils.sheet_to_json(supplierSheet) as any[];
      for (const data of suppliersData) {
        // Cari supplier berdasarkan nama untuk overwrite/update
        const existingSupplier = await prisma.supplier.findFirst({
          where: { name: data.name },
        });

        if (existingSupplier) {
          await prisma.supplier.update({
            where: { id: existingSupplier.id },
            data: {
              ownerName: data.ownerName,
              bankName: data.bankName,
              accountNumber: data.accountNumber?.toString(),
              balance: parseFloat(data.balance) || 0,
            },
          });
        } else {
          await prisma.supplier.create({
            data: {
              id: data.id,
              name: data.name,
              ownerName: data.ownerName,
              bankName: data.bankName,
              accountNumber: data.accountNumber?.toString(),
              balance: parseFloat(data.balance) || 0,
            },
          });
        }
        importedSuppliers++;
      }
    }

    // Process Cashiers
    const cashierSheet = workbook.Sheets["Data Cashier"];
    if (cashierSheet) {
      const cashiersData = XLSX.utils.sheet_to_json(cashierSheet) as any[];
      for (const data of cashiersData) {
        await prisma.cashier.upsert({
          where: { code: data.code },
          update: {
            name: data.name,
          },
          create: {
            id: data.id,
            name: data.name,
            code: data.code,
          },
        });
        importedCashiers++;
      }
    }

    revalidatePath("/(dashboard)/master");
    revalidatePath("/(dashboard)/settings");

    return { 
      success: true, 
      message: `Berhasil mengimport ${importedSuppliers} Supplier dan ${importedCashiers} Kasir.` 
    };
  } catch (error: any) {
    console.error("Import error:", error);
    return { error: "Gagal mengimport database: " + error.message };
  }
}
