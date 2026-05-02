import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export async function GET() {
  try {
    // Ambil data Supplier
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        ownerName: true,
        bankName: true,
        accountNumber: true,
        balance: true,
        createdAt: true,
      },
    });

    // Ambil data Cashier
    const cashiers = await prisma.cashier.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
      },
    });

    // Buat Workbook Excel
    const wb = XLSX.utils.book_new();

    // Buat Sheet untuk Supplier
    const suppliersSheet = XLSX.utils.json_to_sheet(suppliers);
    XLSX.utils.book_append_sheet(wb, suppliersSheet, "Data Supplier");

    // Buat Sheet untuk Cashier
    const cashiersSheet = XLSX.utils.json_to_sheet(cashiers);
    XLSX.utils.book_append_sheet(wb, cashiersSheet, "Data Cashier");

    // Generate buffer dari Workbook
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Buat Arsip ZIP
    const zip = new JSZip();
    zip.file("backup-data-jjs.xlsx", excelBuffer);

    // Generate arraybuffer dari ZIP agar kompatibel dengan NextResponse
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    // Kembalikan response sebagai file download
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="backup-jjs-manage.zip"',
      },
    });
  } catch (error) {
    console.error("Backup generation error:", error);
    return NextResponse.json(
      { error: "Gagal membuat backup database" },
      { status: 500 }
    );
  }
}
