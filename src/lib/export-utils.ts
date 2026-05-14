import * as XLSX from "xlsx";
import { format } from "date-fns";
import { toast } from "sonner";

export const exportReportsToExcel = (activeTab: string, data: any[]) => {
  if (data.length === 0) {
    toast.error("Tidak ada data untuk diexport");
    return;
  }

  let exportData: any[] = [];
  let fileName = "";

  if (activeTab === "transaksi") {
    exportData = data.map((r, i) => ({
      No: i + 1,
      Tanggal: format(new Date(r.date), "dd/MM/yyyy"),
      "No Nota": r.noteNumber || "-",
      Suplier: r.suppliers.join(", "),
      Pendapatan: r.revenue,
      "Mitra Jjs": r.profit80,
      "Toko": r.profit20
    }));
    fileName = `Arsip_Transaksi_${format(new Date(), "yyyyMMdd")}`;
  } else if (activeTab === "setoran") {
    exportData = data.map((p: any, i: number) => ({
      No: i + 1,
      Mitra: p.supplierName || "-",
      Jumlah: p.amount,
      Metode: p.paymentMethod || "-"
    }));
    fileName = `Arsip_Setoran_${format(new Date(), "yyyyMMdd")}`;
  } else if (activeTab === "tabungan") {
    exportData = data.map((s, i) => ({
      No: i + 1,
      Tanggal: s.date ? format(new Date(s.date), "dd/MM/yyyy") : "-",
      "No Nota": s.noteNumber || "-",
      "Suplier": s.supplierNames.join(", ") || "-",
      "Total Omzet": s.totalRevenue,
      "Total Tabungan": s.totalTabungan
    }));
    fileName = `Arsip_Tabungan_${format(new Date(), "yyyyMMdd")}`;
  } else if (activeTab === "potongan") {
    exportData = data.map((d, i) => ({
      No: i + 1,
      Tanggal: format(new Date(d.date || d.createdAt), "dd/MM/yyyy"),
      "No Nota": d.noteNumber || "-",
      Suplier: d.supplierNames.join(", "),
      "Service Charge": d.serviceCharge || 0,
      Kukuluban: d.kukuluban || 0,
      Tabungan: d.tabungan || 0,
      Total: (d.serviceCharge || 0) + (d.kukuluban || 0) + (d.tabungan || 0)
    }));
    fileName = `Arsip_Potongan_${format(new Date(), "yyyyMMdd")}`;
  } else if (activeTab === "produk") {
    exportData = data.map((g, i) => ({
      No: i + 1,
      Tanggal: format(new Date(g.date), "dd/MM/yyyy"),
      "No Nota": g.noteNumber || "-",
      Suplier: g.supplierNames.join(", "),
      "Total Beli (Qty)": g.totalBeli,
      "Total Jual (Qty)": g.totalJual,
      "Reture Jual (Qty)": g.totalRetureJual
    }));
    fileName = `Arsip_Produk_Per_Nota_${format(new Date(), "yyyyMMdd")}`;
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Archive");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
  toast.success("Export berhasil");
};
