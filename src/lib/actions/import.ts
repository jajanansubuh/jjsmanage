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
    let importedReports = 0;

    // 1. PROCESS SUPPLIERS (Sheet: "Daftar Suplier" or "Data Supplier")
    const supplierSheet = workbook.Sheets["Daftar Suplier"] || workbook.Sheets["Data Supplier"];
    if (supplierSheet) {
      const suppliersData = XLSX.utils.sheet_to_json(supplierSheet) as any[];
      for (const data of suppliersData) {
        // Mapping friendly headers or technical ones
        const name = data['Nama Suplier'] || data.name;
        if (!name) continue;

        const existingSupplier = await prisma.supplier.findFirst({
          where: { name: name },
        });

        if (existingSupplier) {
          await prisma.supplier.update({
            where: { id: existingSupplier.id },
            data: {
              ownerName: data['Pemilik'] || data.ownerName,
              bankName: data['Bank'] || data.bankName,
              accountNumber: (data['No. Rekening'] || data.accountNumber)?.toString(),
              balance: parseFloat(data['Saldo Saat Ini'] || data.balance) || 0,
            },
          });
        } else {
          await prisma.supplier.create({
            data: {
              name: name,
              ownerName: data['Pemilik'] || data.ownerName,
              bankName: data['Bank'] || data.bankName,
              accountNumber: (data['No. Rekening'] || data.accountNumber)?.toString(),
              balance: parseFloat(data['Saldo Saat Ini'] || data.balance) || 0,
            },
          });
        }
        importedSuppliers++;
      }
    }

    // 2. PROCESS TRANSACTIONS (Sheet: "Transaksi Pernota")
    const reportSheet = workbook.Sheets["Transaksi Pernota"];
    if (reportSheet) {
      const reportsData = XLSX.utils.sheet_to_json(reportSheet) as any[];
      
      // Get all suppliers for mapping name to ID
      const allSuppliers = await prisma.supplier.findMany();
      
      for (const data of reportsData) {
        const supplierName = data['Nama Suplier'];
        const noteNumber = data['No. Nota']?.toString();
        if (!supplierName || !noteNumber) continue;

        const supplier = allSuppliers.find(s => s.name === supplierName);
        if (!supplier) continue;

        // Cek apakah transaksi sudah ada (berdasarkan No Nota dan Supplier)
        const existingReport = await prisma.consignmentReport.findFirst({
          where: { 
            noteNumber: noteNumber,
            supplierId: supplier.id
          }
        });

        // Parse date
        let date = new Date();
        if (data['Tanggal']) {
          // Handle format dd/mm/yyyy
          const parts = data['Tanggal'].split('/');
          if (parts.length === 3) {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            date = new Date(data['Tanggal']);
          }
        }

        const reportData = {
          date: date,
          noteNumber: noteNumber,
          supplierId: supplier.id,
          revenue: parseFloat(data['Pendapatan']) || 0,
          cost: parseFloat(data['Cost']) || 0,
          barcode: parseFloat(data['Barcode']) || 0,
          serviceCharge: parseFloat(data['Service Charge']) || 0,
          kukuluban: parseFloat(data['Kukuluban']) || 0,
          tabungan: parseFloat(data['Tabungan']) || 0,
          profit80: parseFloat(data['Mitra JJS (80%)']) || 0,
          profit20: parseFloat(data['Toko (20%)']) || 0,
          notes: data['Catatan'] || '',
          items: data['__raw_items'] ? JSON.parse(data['__raw_items']) : []
        };

        if (existingReport) {
          await prisma.consignmentReport.update({
            where: { id: existingReport.id },
            data: reportData
          });
        } else {
          await prisma.consignmentReport.create({
            data: reportData
          });
        }
        importedReports++;
      }
    }

    revalidatePath("/(dashboard)");
    
    return { 
      success: true, 
      message: `Berhasil mengimport ${importedSuppliers} Suplier dan ${importedReports} Nota Transaksi.` 
    };
  } catch (error: any) {
    console.error("Import error:", error);
    return { error: "Gagal mengimport database: " + error.message };
  }
}
