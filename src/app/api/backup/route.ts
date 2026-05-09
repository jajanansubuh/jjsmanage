import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { format } from "date-fns";

export async function GET() {
  try {
    // 1. Ambil data Supplier
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });

    // 2. Ambil data Transaksi (ConsignmentReport)
    const reports = await prisma.consignmentReport.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Proses Data Produk (Aggregation)
    const productMap = new Map();
    reports.forEach((report: any) => {
      const items = report.items || [];
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const name = (item.name || '').trim();
          if (!name) return;

          if (productMap.has(name)) {
            const existing = productMap.get(name)!;
            existing.totalBeli += Number(item.qtyBeli) || 0;
            existing.totalJual += Number(item.qtyJual) || 0;
            existing.totalRetureJual += (item.retureJual != null && !isNaN(Number(item.retureJual))) ? Number(item.retureJual) : 0;
          } else {
            productMap.set(name, {
              name: name,
              totalBeli: Number(item.qtyBeli) || 0,
              totalJual: Number(item.qtyJual) || 0,
              totalRetureJual: (item.retureJual != null && !isNaN(Number(item.retureJual))) ? Number(item.retureJual) : 0,
            });
          }
        });
      }
    });

    // Buat Workbook Excel
    const wb = XLSX.utils.book_new();

    // --- SHEET 1: DAFTAR SUPLIER ---
    const supplierData = suppliers.map(s => ({
      'ID Suplier': s.id,
      'Nama Suplier': s.name,
      'Pemilik': s.ownerName || '-',
      'Bank': s.bankName || '-',
      'No. Rekening': s.accountNumber || '-',
      'Saldo Saat Ini': s.balance,
      'Terdaftar Pada': format(s.createdAt, 'dd/MM/yyyy HH:mm')
    }));
    const suppliersSheet = XLSX.utils.json_to_sheet(supplierData);
    XLSX.utils.book_append_sheet(wb, suppliersSheet, "Daftar Suplier");

    // --- SHEET 2: LAPORAN TRANSAKSI PERNOTA ---
    const transactionData = reports.map(r => ({
      'Tanggal': format(r.date, 'dd/MM/yyyy'),
      'No. Nota': r.noteNumber || '-',
      'Nama Suplier': r.supplier.name,
      'Pendapatan': r.revenue,
      'Cost': r.cost,
      'Barcode': r.barcode,
      'Service Charge': r.serviceCharge || 0,
      'Kukuluban': r.kukuluban || 0,
      'Tabungan': r.tabungan || 0,
      'Mitra JJS (80%)': r.profit80,
      'Toko (20%)': r.profit20,
      'Catatan': r.notes || '-',
      '__raw_items': JSON.stringify(r.items || []) // Hidden-ish field for restoration
    }));
    const transactionSheet = XLSX.utils.json_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(wb, transactionSheet, "Transaksi Pernota");

    // --- SHEET 3: PRODUK ALL (QTY) ---
    const productData = Array.from(productMap.values()).map(p => ({
      'Nama Barang': p.name,
      'Total Beli': p.totalBeli,
      'Total Jual': p.totalJual,
      'Total Reture Jual': p.totalRetureJual,
      'Persentase Laku (%)': p.totalBeli > 0 ? ((p.totalJual / p.totalBeli) * 100).toFixed(2) : 0
    }));
    const productSheet = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(wb, productSheet, "Ringkasan Produk");

    // --- SHEET 4: TABUNGAN SUPLIER ---
    // Agregasi tabungan per suplier
    const savingsMap = new Map();
    reports.forEach(r => {
      const sName = r.supplier.name;
      const amount = r.tabungan || 0;
      if (savingsMap.has(sName)) {
        savingsMap.set(sName, savingsMap.get(sName) + amount);
      } else {
        savingsMap.set(sName, amount);
      }
    });

    const savingsData = Array.from(savingsMap.entries()).map(([name, total]) => ({
      'Nama Suplier': name,
      'Total Akumulasi Tabungan': total
    }));
    const savingsSheet = XLSX.utils.json_to_sheet(savingsData);
    XLSX.utils.book_append_sheet(wb, savingsSheet, "Tabungan");

    // Generate buffer dari Workbook
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Buat Arsip ZIP
    const zip = new JSZip();
    zip.file(`backup-jjs-${format(new Date(), 'yyyyMMdd-HHmm')}.xlsx`, excelBuffer);

    // Generate arraybuffer dari ZIP
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    // Kembalikan response sebagai file download
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="backup-jjs-full-${format(new Date(), 'yyyyMMdd')}.zip"`,
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
