import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    // 1. Ambil data Supplier
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });

    // 2. Ambil data Transaksi (ConsignmentReport)
    const reports = await prisma.consignmentReport.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Ambil data Master Produk
    const products = await prisma.product.findMany({
      include: { supplier: true },
      orderBy: { name: 'asc' }
    });

    // 4. Ambil data Riwayat Payout
    const payouts = await prisma.supplierPayout.findMany({
      include: { supplier: true },
      orderBy: { date: 'desc' }
    });

    // 5. Ambil data Kasir
    const cashiers = await prisma.cashier.findMany({
      orderBy: { name: 'asc' }
    });

    // 6. Ambil data Antrean Cetak Label
    const labelPrints = await prisma.labelPrint.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'desc' }
    });

    // 7. Ambil data Pengguna Sistem
    const users = await prisma.user.findMany({
      include: { supplier: true },
      orderBy: { username: 'asc' }
    });

    // Proses Data Produk (Aggregation untuk Ringkasan Produk)
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
      'Saldo Saat Ini': Number(s.balance) || 0,
      'Saldo Validasi': Number(s.validatedBalance) || 0,
      'Terdaftar Pada': format(new Date(s.createdAt), 'dd/MM/yyyy HH:mm')
    }));
    const suppliersSheet = XLSX.utils.json_to_sheet(supplierData);
    XLSX.utils.book_append_sheet(wb, suppliersSheet, "Daftar Suplier");

    // --- SHEET 2: LAPORAN TRANSAKSI PERNOTA ---
    const transactionData = reports.map(r => ({
      'Tanggal': format(new Date(r.date), 'dd/MM/yyyy'),
      'No. Nota': r.noteNumber || '-',
      'Nama Suplier': r.supplier?.name || '-',
      'Pendapatan': Number(r.revenue) || 0,
      'Cost': Number(r.cost) || 0,
      'Barcode': Number(r.barcode) || 0,
      'Service Charge': Number(r.serviceCharge) || 0,
      'Kukuluban': Number(r.kukuluban) || 0,
      'Tabungan': Number(r.tabungan) || 0,
      'Mitra JJS (80%)': Number(r.profit80) || 0,
      'Toko (20%)': Number(r.profit20) || 0,
      'Tanggal Pemotongan': r.deductionDate ? format(new Date(r.deductionDate), 'dd/MM/yyyy') : '-',
      'No. Nota Pemotongan': r.deductionNoteNumber || '-',
      'Sudah divalidasi': r.isValidated ? 'Ya' : 'Tidak',
      'Catatan': r.notes || '-',
      '__raw_items': JSON.stringify(r.items || []) // Hidden field for restoration
    }));
    const transactionSheet = XLSX.utils.json_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(wb, transactionSheet, "Transaksi Pernota");

    // --- SHEET 3: RINGKASAN PRODUK ---
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
    const savingsMap = new Map();
    reports.forEach(r => {
      const sName = r.supplier?.name || '-';
      const amount = Number(r.tabungan) || 0;
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

    // --- SHEET 5: SETORAN (Friendly Grouped Setoran Tervalidasi) ---
    const setoranGroups = new Map();
    reports.forEach(r => {
      if (!r.isValidated) return;
      if (!r.supplier) return;

      const reportDate = new Date(r.date || r.createdAt);
      const dateStr = format(reportDate, "yyyy-MM-dd");
      const key = `${dateStr}_${r.supplier.id}`;

      if (setoranGroups.has(key)) {
        const existing = setoranGroups.get(key);
        existing.amount += Number(r.profit80) || 0;
      } else {
        setoranGroups.set(key, {
          date: reportDate,
          supplierName: r.supplier.name,
          amount: Number(r.profit80) || 0,
          paymentMethod: r.supplier.bankName || "CASH"
        });
      }
    });

    const setoranData = Array.from(setoranGroups.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map(d => ({
        'Tanggal': format(d.date, 'dd/MM/yyyy'),
        'Nama Suplier (Mitra)': d.supplierName,
        'Total Setoran (80%)': d.amount,
        'Metode Pembayaran': d.paymentMethod
      }));
    const setoranSheet = XLSX.utils.json_to_sheet(setoranData);
    XLSX.utils.book_append_sheet(wb, setoranSheet, "Setoran");

    // --- SHEET 6: POTONGAN (Friendly Grouped Potongan) ---
    const potonganGroups = new Map();
    reports.forEach(r => {
      const serviceCharge = Number(r.serviceCharge) || 0;
      const kukuluban = Number(r.kukuluban) || 0;
      const tabungan = Number(r.tabungan) || 0;
      const hasDeduction = serviceCharge > 0 || kukuluban > 0 || tabungan > 0;
      if (!hasDeduction) return;

      const dateKey = r.deductionDate ? new Date(r.deductionDate).toISOString().split('T')[0] : null;
      const key = r.deductionNoteNumber || (dateKey ? `DATE-${dateKey}` : r.noteNumber) || `DED-${r.id}`;

      if (potonganGroups.has(key)) {
        const existing = potonganGroups.get(key);
        existing.serviceCharge += serviceCharge;
        existing.kukuluban += kukuluban;
        existing.tabungan += tabungan;
        if (r.supplier?.name && !existing.supplierNames.includes(r.supplier.name)) {
          existing.supplierNames.push(r.supplier.name);
        }
      } else {
        potonganGroups.set(key, {
          deductionNoteNumber: r.deductionNoteNumber,
          noteNumber: r.noteNumber,
          deductionDate: r.deductionDate || r.date || r.createdAt,
          serviceCharge: serviceCharge,
          kukuluban: kukuluban,
          tabungan: tabungan,
          supplierNames: r.supplier?.name ? [r.supplier.name] : []
        });
      }
    });

    const potonganData = Array.from(potonganGroups.values())
      .sort((a, b) => new Date(b.deductionDate).getTime() - new Date(a.deductionDate).getTime())
      .map(d => {
        const total = d.serviceCharge + d.kukuluban + d.tabungan;
        return {
          'Tanggal Potongan': format(new Date(d.deductionDate), 'dd/MM/yyyy'),
          'No. Nota Potongan': d.deductionNoteNumber || d.noteNumber || '-',
          'Nama Suplier': d.supplierNames.join(', '),
          'Service Charge': d.serviceCharge,
          'Kukuluban': d.kukuluban,
          'Tabungan': d.tabungan,
          'Total Potongan': total
        };
      });
    const potonganSheet = XLSX.utils.json_to_sheet(potonganData);
    XLSX.utils.book_append_sheet(wb, potonganSheet, "Potongan");

    // --- SHEET 7: MASTER PRODUK ---
    const masterProductData = products.map(p => ({
      'ID Produk': p.id,
      'Nama Produk': p.name,
      'Kode / Barcode': p.code || '-',
      'ID Suplier': p.supplierId || '-',
      'Nama Suplier': p.supplier?.name || '-',
      'Tanggal Dibuat': format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')
    }));
    const productMasterSheet = XLSX.utils.json_to_sheet(masterProductData);
    XLSX.utils.book_append_sheet(wb, productMasterSheet, "Master Produk");

    // --- SHEET 8: RIWAYAT PAYOUT ---
    const payoutData = payouts.map(py => ({
      'ID Payout': py.id,
      'ID Suplier': py.supplierId,
      'Nama Suplier': py.supplier?.name || '-',
      'Jumlah Payout': Number(py.amount) || 0,
      'Tanggal Payout': format(new Date(py.date), 'dd/MM/yyyy'),
      'Catatan': py.notes || '-',
      'Tanggal Dibuat': format(new Date(py.createdAt), 'dd/MM/yyyy HH:mm')
    }));
    const payoutSheet = XLSX.utils.json_to_sheet(payoutData);
    XLSX.utils.book_append_sheet(wb, payoutSheet, "Riwayat Payout");

    // --- SHEET 9: DAFTAR KASIR ---
    const cashierData = cashiers.map(c => ({
      'ID Kasir': c.id,
      'Nama Kasir': c.name,
      'Kode Kasir': c.code,
      'Tanggal Dibuat': format(new Date(c.createdAt), 'dd/MM/yyyy HH:mm')
    }));
    const cashierSheet = XLSX.utils.json_to_sheet(cashierData);
    XLSX.utils.book_append_sheet(wb, cashierSheet, "Daftar Kasir");

    // --- SHEET 10: CETAK LABEL ---
    const labelData = labelPrints.map(l => ({
      'ID Cetak': l.id,
      'ID Suplier': l.supplierId,
      'Nama Suplier': l.supplier?.name || '-',
      'Nama Barang': l.name,
      'Kode / Barcode': l.code || '-',
      'Jumlah Qty': l.qty,
      'Status': l.status,
      'Tanggal Dibuat': format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm')
    }));
    const labelSheet = XLSX.utils.json_to_sheet(labelData);
    XLSX.utils.book_append_sheet(wb, labelSheet, "Cetak Label");

    // --- SHEET 11: PENGGUNA SISTEM ---
    const userData = users.map(u => ({
      'ID User': u.id,
      'Username': u.username,
      'Password Hash': u.password,
      'Nama Lengkap': u.name || '-',
      'Role': u.role,
      'Permissions': JSON.stringify(u.permissions || []),
      'ID Suplier': u.supplierId || '-',
      'Nama Suplier': u.supplier?.name || '-',
      'Sudah Ubah Password': u.isCredentialsChanged ? 'Ya' : 'Tidak',
      'Tanggal Dibuat': format(new Date(u.createdAt), 'dd/MM/yyyy HH:mm')
    }));
    const userSheet = XLSX.utils.json_to_sheet(userData);
    XLSX.utils.book_append_sheet(wb, userSheet, "Pengguna Sistem");

    // Generate buffer dari Workbook
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Buat database raw dump JSON yang murni untuk keperluan restore database
    const rawDump = {
      suppliers,
      consignmentReports: reports,
      products,
      supplierPayouts: payouts,
      cashiers,
      labelPrints,
      users
    };

    const safeJsonStringify = (data: any) => {
      return JSON.stringify(data, (key, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      }, 2);
    };

    const rawJsonBuffer = Buffer.from(safeJsonStringify(rawDump), "utf-8");

    // Buat Arsip ZIP
    const zip = new JSZip();
    const dateFormatted = format(new Date(), 'yyyyMMdd-HHmm');
    zip.file(`backup-jjs-${dateFormatted}.xlsx`, excelBuffer);
    zip.file(`backup-jjs-raw-${dateFormatted}.json`, rawJsonBuffer);

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
