"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Scissors,
  History,
  ArrowUpDown,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Calendar,
  AlertCircle,
  Printer,
  Download
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface DeductionDetail {
  id: string;
  date: string;
  barcode: number;
  serviceCharge: number;
  kukuluban: number;
  noteNumber: string | null;
  revenue: number;
  profit80: number;
}

interface SupplierDeduction {
  id: string;
  name: string;
  ownerName: string;
  totalBarcode: number;
  totalServiceCharge: number;
  totalKukuluban: number;
  totalDeduction: number;
}

export default function PotonganSummaryPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<SupplierDeduction[]>([]);
  const [supplierData, setSupplierData] = useState<{ 
    totalBarcode: number;
    totalServiceCharge: number;
    totalKukuluban: number;
    totalDeduction: number;
    history: DeductionDetail[] 
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "name", direction: "asc" });
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;
  const [adminPage, setAdminPage] = useState(1);
  const adminPerPage = 10;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDeduction | null>(null);
  const [supplierHistoryData, setSupplierHistoryData] = useState<{ totalDeduction: number; history: DeductionDetail[]; supplier?: any } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleOpenSupplierHistory = async (supplier: SupplierDeduction) => {
    setSelectedSupplier(supplier);
    setLoadingHistory(true);
    setSupplierHistoryData(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("supplierId", supplier.id);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      const res = await fetch(`/api/deductions/summary?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSupplierHistoryData(data);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat potongan supplier:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    setHistoryPage(1);
    setAdminPage(1);
  }, [searchTerm, startDate, endDate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const roleRes = await fetch('/api/auth/role');
        if (!roleRes.ok) throw new Error("Gagal mengambil data peran user");
        const roleData = await roleRes.json();
        const normalizedRole = roleData.role?.toUpperCase();
        setRole(normalizedRole);

        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);
        const url = `/api/deductions/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const deductionsRes = await fetch(url);
        if (!deductionsRes.ok) {
          const errData = await deductionsRes.json();
          throw new Error(errData.error || "Gagal mengambil data potongan");
        }
        const deductionsData = await deductionsRes.json();

        if (normalizedRole === "SUPPLIER") {
          setSupplierData(deductionsData);
        } else {
          setAdminData(Array.isArray(deductionsData) ? deductionsData : []);
        }
      } catch (err) {
        console.error("Failed to fetch deductions summary:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    if (role === "SUPPLIER") {
      const history = supplierData?.history || [];
      if (history.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }
      const exportData = history.map((item, index) => {
        const total = Number(item.barcode || 0) + Number(item.serviceCharge || 0) + Number(item.kukuluban || 0);
        return {
          No: index + 1,
          Tanggal: format(new Date(item.date), "dd/MM/yyyy"),
          "No. Nota": item.noteNumber || "-",
          Omzet: item.revenue,
          Barcode: item.barcode,
          "Service Charge": item.serviceCharge,
          Kukuluban: item.kukuluban,
          "Total Potongan": total
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Potongan");
      XLSX.writeFile(workbook, `Laporan_Potongan_Mitra_${format(new Date(), "yyyyMMdd")}.xlsx`);
    } else {
      if (filteredAdminData.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }
      const exportData = filteredAdminData.map((item, index) => ({
        No: index + 1,
        "Nama Mitra": item.name,
        "Pemilik": item.ownerName,
        Barcode: item.totalBarcode,
        "Service Charge": item.totalServiceCharge,
        Kukuluban: item.totalKukuluban,
        "Total Potongan": item.totalDeduction
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Potongan");
      XLSX.writeFile(workbook, `Laporan_Potongan_Mitra_${format(new Date(), "yyyyMMdd")}.xlsx`);
    }
    toast.success("Export berhasil");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const periodText = startDate && endDate 
      ? `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`
      : "Semua Periode";

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const logoUrl = `${origin}/logojjsmanage.png`;

    const getHeader = (title: string) => `
      <div class="header">
        <div class="logo-container" style="margin-bottom: 8px; text-align: center;">
          <img src="${logoUrl}" alt="Logo JJS" style="height: 55px; width: auto; max-width: 220px; object-fit: contain; display: inline-block;" />
        </div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">${title}</h1>
      </div>
    `;

    const getHeadStyle = (titleText: string) => `
      <meta charset="utf-8">
      <title>${titleText}</title>
      ${origin ? `<base href="${origin}/">` : ''}
      <style>
        @page { size: portrait; margin: 10mm 12mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111; line-height: 1.3; margin: 0; padding: 0; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #222; padding-bottom: 12px; }
        .meta-grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px; }
        .meta-item { margin-bottom: 3px; }
        .meta-label { font-weight: bold; color: #555; display: inline-block; width: 100px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        th { background: #f1f5f9; padding: 8px 6px; text-align: left; border: 1px solid #cbd5e1; text-transform: uppercase; white-space: nowrap; font-weight: bold; }
        td { padding: 6px; border: 1px solid #e2e8f0; vertical-align: middle; }
        .col-nowrap { white-space: nowrap; font-weight: bold; min-width: 140px; }
        .total-row td { background: #f8fafc; font-weight: bold; border-top: 2px solid #334155; }
        .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig { border-top: 1px solid #333; width: 180px; text-align: center; padding-top: 6px; margin-top: 50px; font-size: 12px; font-weight: bold; }
      </style>
    `;

    let content = "";
    if (role === "SUPPLIER") {
      const rowsHtml = (supplierData?.history || []).map((item, index) => {
        const total = Number(item.barcode || 0) + Number(item.serviceCharge || 0) + Number(item.kukuluban || 0);
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${format(new Date(item.date), "dd/MM/yyyy")}</td>
            <td>${item.noteNumber || "-"}</td>
            <td align="right">${new Intl.NumberFormat("id-ID").format(item.revenue)}</td>
            <td align="right">${new Intl.NumberFormat("id-ID").format(item.barcode)}</td>
            <td align="right">${new Intl.NumberFormat("id-ID").format(item.serviceCharge)}</td>
            <td align="right">${new Intl.NumberFormat("id-ID").format(item.kukuluban)}</td>
            <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(total)}</strong></td>
          </tr>
        `;
      }).join("");

      content = `
        <!DOCTYPE html>
        <html>
          <head>
            ${getHeadStyle("Laporan Potongan Mitra")}
          </head>
          <body>
            ${getHeader("Laporan Potongan Mitra")}
            <div class="meta-grid">
              <div class="meta-item"><span class="meta-label">Periode:</span> ${periodText}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th width="30">No</th>
                  <th>Tanggal</th>
                  <th>No. Nota</th>
                  <th align="right">Omzet</th>
                  <th align="right">Barcode</th>
                  <th align="right">S.Charge</th>
                  <th align="right">Kukuluban</th>
                  <th align="right">Total Potongan</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr class="total-row">
                  <td colspan="4" align="center">TOTAL KESELURUHAN</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(supplierData?.totalBarcode || 0)}</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(supplierData?.totalServiceCharge || 0)}</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(supplierData?.totalKukuluban || 0)}</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(supplierData?.totalDeduction || 0)}</td>
                </tr>
              </tbody>
            </table>
            <div class="footer-sig">
              <div class="sig">Kasir / Admin</div>
              <div class="sig">Manager Toko</div>
            </div>
          </body>
        </html>
      `;
    } else {
      const rowsHtml = filteredAdminData.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td class="col-nowrap">${item.name}</td>
          <td class="col-nowrap">${item.ownerName}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(item.totalBarcode)}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(item.totalServiceCharge)}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(item.totalKukuluban)}</td>
          <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(item.totalDeduction)}</strong></td>
        </tr>
      `).join("");

      const grandTotals = {
        bc: filteredAdminData.reduce((s, x) => s + x.totalBarcode, 0),
        sc: filteredAdminData.reduce((s, x) => s + x.totalServiceCharge, 0),
        kuk: filteredAdminData.reduce((s, x) => s + x.totalKukuluban, 0),
        ded: filteredAdminData.reduce((s, x) => s + x.totalDeduction, 0),
      };

      content = `
        <!DOCTYPE html>
        <html>
          <head>
            ${getHeadStyle("Laporan Ringkasan Potongan Mitra")}
          </head>
          <body>
            ${getHeader("Laporan Ringkasan Potongan Mitra")}
            <div class="meta-grid">
              <div class="meta-item"><span class="meta-label">Periode:</span> ${periodText}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th width="30">No</th>
                  <th class="col-nowrap">Nama Mitra</th>
                  <th class="col-nowrap">Pemilik</th>
                  <th align="right">Barcode</th>
                  <th align="right">S.Charge</th>
                  <th align="right">Kukuluban</th>
                  <th align="right">Total Potongan</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr class="total-row">
                  <td colspan="3" align="center">TOTAL KESELURUHAN</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(grandTotals.bc)}</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(grandTotals.sc)}</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(grandTotals.kuk)}</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(grandTotals.ded)}</td>
                </tr>
              </tbody>
            </table>
            <div class="footer-sig">
              <div class="sig">Kasir / Admin</div>
              <div class="sig">Manager Toko</div>
            </div>
          </body>
        </html>
      `;
    }

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  const filteredAdminData = useMemo(() => {
    if (!Array.isArray(adminData)) return [];

    const result = [...adminData].filter(
      (s) =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = (a as any)[sortConfig.key] || 0;
        const valB = (b as any)[sortConfig.key] || 0;
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [adminData, searchTerm, sortConfig]);

  const paginatedAdminData = useMemo(() => {
    const start = (adminPage - 1) * adminPerPage;
    return filteredAdminData.slice(start, start + adminPerPage);
  }, [filteredAdminData, adminPage]);

  const adminTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAdminData.length / adminPerPage));
  }, [filteredAdminData]);

  const adminTotals = useMemo(() => {
    if (!Array.isArray(filteredAdminData)) {
      return { totalBarcode: 0, totalServiceCharge: 0, totalKukuluban: 0, totalDeduction: 0, supplierCount: 0 };
    }
    return filteredAdminData.reduce(
      (acc, s) => ({
        totalBarcode: acc.totalBarcode + (Number(s.totalBarcode) || 0),
        totalServiceCharge: acc.totalServiceCharge + (Number(s.totalServiceCharge) || 0),
        totalKukuluban: acc.totalKukuluban + (Number(s.totalKukuluban) || 0),
        totalDeduction: acc.totalDeduction + (Number(s.totalDeduction) || 0),
        supplierCount: acc.supplierCount + 1,
      }),
      { totalBarcode: 0, totalServiceCharge: 0, totalKukuluban: 0, totalDeduction: 0, supplierCount: 0 }
    );
  }, [filteredAdminData]);

  const paginatedHistory = useMemo(() => {
    if (!supplierData?.history) return [];
    const start = (historyPage - 1) * historyPerPage;
    return supplierData.history.slice(start, start + historyPerPage);
  }, [supplierData, historyPage]);

  const historyTotalPages = useMemo(() => {
    if (!supplierData?.history) return 1;
    return Math.max(1, Math.ceil(supplierData.history.length / historyPerPage));
  }, [supplierData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Memuat data potongan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white">Oops! Terjadi Kesalahan</h3>
        <p className="text-slate-400 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-rose-600 hover:bg-rose-700 rounded-xl">
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10 px-0 md:px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Ringkasan Potongan
          </h2>
          <p className="text-muted-foreground text-sm md:text-base font-medium">Akumulasi potongan (Barcode, S.Charge, Kukuluban) dari transaksi.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            className="w-full sm:w-auto h-12 bg-slate-950/40"
          />

          {role !== "SUPPLIER" && (
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
              <Input
                placeholder="Cari Mitra / Pemilik..."
                className="pl-11 pr-4 h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-rose-500/20 focus:border-rose-500/50 transition-all font-medium text-white w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handlePrint}
              className="h-12 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-2xl px-4 flex items-center justify-center gap-2 transition-all active:scale-95 flex-1 sm:flex-none"
            >
              <Printer className="w-4 h-4 text-rose-400" /> Cetak
            </Button>

            <Button
              onClick={handleExport}
              className="h-12 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-2xl px-4 flex items-center justify-center gap-2 transition-all active:scale-95 flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 text-blue-400" /> Export
            </Button>
          </div>
        </div>
      </div>

      {role === "SUPPLIER" ? (
        supplierData ? (
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {/* Summary Card */}
            <Card className="overflow-hidden relative group shadow-lg mx-4 md:mx-0">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Scissors size={140} className="text-white md:hidden" />
                <Scissors size={180} className="text-white hidden md:block" />
              </div>
              <CardContent className="p-6 md:p-10 relative z-10">
                <div className="flex flex-col gap-2 text-center md:text-left">
                  <span className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">Jumlah Total Yang Dipotong</span>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-3">
                    <span className="text-4xl md:text-6xl font-black text-primary tracking-tighter">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0
                      }).format(supplierData.totalDeduction || 0)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">Barcode</p>
                      <p className="text-lg font-bold text-foreground">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(supplierData.totalBarcode)}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">S.Charge</p>
                      <p className="text-lg font-bold text-foreground">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(supplierData.totalServiceCharge)}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">Kukuluban</p>
                      <p className="text-lg font-bold text-foreground">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(supplierData.totalKukuluban)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History Mobile View */}
            <div className="md:hidden space-y-4 px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <History className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Riwayat Pemotongan</h3>
              </div>

              {!supplierData.history || supplierData.history.length === 0 ? (
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
                  <p className="text-slate-500 font-medium italic">Belum ada riwayat potongan.</p>
                </div>
              ) : (
                <>
                {paginatedHistory.map((item) => {
                  const total = Number(item.barcode || 0) + Number(item.serviceCharge || 0) + Number(item.kukuluban || 0);
                  return (
                  <Card key={item.id} className="group">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</span>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-rose-400" />
                            <p className="text-sm font-bold text-slate-200">
                              {format(new Date(item.date), "dd MMM yyyy", { locale: localeId })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Total Potongan</span>
                          <span className="text-lg font-black text-rose-400">
                            -{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(total)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Barcode</span>
                          <p className="text-sm font-bold text-slate-400">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.barcode)}
                          </p>
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">S.Charge</span>
                          <p className="text-sm font-bold text-slate-400">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.serviceCharge)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kukuluban</span>
                          <p className="text-sm font-bold text-slate-400">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.kukuluban)}
                          </p>
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">No. Nota</span>
                          <p className="text-sm font-mono font-bold text-slate-400">
                            {item.noteNumber || "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )})}
                {supplierData.history.length > historyPerPage && (
                  <div className="flex items-center justify-between px-2 py-2">
                     <span className="text-xs text-slate-400 font-medium">Halaman {historyPage} dari {historyTotalPages}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                        disabled={historyPage === historyTotalPages}
                        className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>

            {/* History Table Desktop */}
            <div className="hidden md:block space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <History className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Riwayat Pemotongan</h3>
              </div>

              <Card className="overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/2">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Tanggal</TableHead>
                          <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">No. Nota</TableHead>
                          <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Barcode</TableHead>
                          <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">S.Charge</TableHead>
                          <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Kukuluban</TableHead>
                          <TableHead className="py-6 px-8 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Total Potongan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!supplierData.history || supplierData.history.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-20 text-slate-500 font-medium italic">
                              Belum ada riwayat potongan.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedHistory.map((item) => {
                            const total = Number(item.barcode || 0) + Number(item.serviceCharge || 0) + Number(item.kukuluban || 0);
                            return (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/2 transition-all duration-300 group">
                              <TableCell className="py-6 px-8">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
                                  <span className="font-bold text-slate-200">
                                    {format(new Date(item.date), "dd MMMM yyyy", { locale: localeId })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                                  {item.noteNumber || "-"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-slate-400 text-sm">
                                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.barcode)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-slate-400 text-sm">
                                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.serviceCharge)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-slate-400 text-sm">
                                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.kukuluban)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right px-8">
                                <span className="font-black text-lg text-rose-400">
                                  - {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    maximumFractionDigits: 0
                                  }).format(total)}
                                </span>
                              </TableCell>
                            </TableRow>
                          )})
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {supplierData.history && supplierData.history.length > historyPerPage && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-900/40">
                      <span className="text-xs text-slate-400 font-medium">Halaman {historyPage} dari {historyTotalPages}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                          className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                          disabled={historyPage === historyTotalPages}
                          className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mx-4 md:mx-0 flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-[2rem] border border-white/5">
            <Scissors className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-500 font-medium italic">Data potongan tidak ditemukan.</p>
          </div>
        )
      ) : (
        <div className="px-4 md:px-0 space-y-6">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-5 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Potongan</span>
                <span className="text-xl md:text-2xl font-extrabold text-white tracking-tight tabular-nums block mt-1.5">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(adminTotals.totalDeduction)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium block mt-1">{adminTotals.supplierCount} Supplier</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-5 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Barcode</span>
                <span className="text-xl md:text-2xl font-extrabold text-rose-300 tracking-tight tabular-nums block mt-1.5">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(adminTotals.totalBarcode)}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-5 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total S.Charge</span>
                <span className="text-xl md:text-2xl font-extrabold text-amber-300 tracking-tight tabular-nums block mt-1.5">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(adminTotals.totalServiceCharge)}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-5 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Kukuluban</span>
                <span className="text-xl md:text-2xl font-extrabold text-purple-300 tracking-tight tabular-nums block mt-1.5">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(adminTotals.totalKukuluban)}
                </span>
              </div>
            </div>
          </div>

          <Card className="border-white/10 bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900/90 border-b border-white/10">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="py-4 px-6 cursor-pointer group" onClick={() => handleSort("name")}>
                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                          Nama Mitra <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-4 cursor-pointer group" onClick={() => handleSort("ownerName")}>
                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                          Pemilik <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-4 text-right cursor-pointer group" onClick={() => handleSort("totalBarcode")}>
                        <div className="flex items-center justify-end gap-2 font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                          Barcode <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-4 text-right cursor-pointer group" onClick={() => handleSort("totalServiceCharge")}>
                        <div className="flex items-center justify-end gap-2 font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                          S.Charge <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-4 text-right cursor-pointer group" onClick={() => handleSort("totalKukuluban")}>
                        <div className="flex items-center justify-end gap-2 font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                          Kukuluban <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-4 px-6 text-right cursor-pointer group" onClick={() => handleSort("totalDeduction")}>
                        <div className="flex items-center justify-end gap-2 font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                          Total Potongan <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAdminData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-24 text-slate-500 font-medium italic">
                          Tidak ada data potongan mitra.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAdminData.map((item) => (
                        <TableRow 
                          key={item.id} 
                          className="border-b border-white/5 hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer"
                          onClick={() => handleOpenSupplierHistory(item)}
                        >
                          <TableCell className="py-4 px-6 font-bold text-white text-sm uppercase">
                            {item.name}
                          </TableCell>
                          <TableCell className="py-4 font-medium text-slate-300 text-sm">
                            {item.ownerName}
                          </TableCell>
                          <TableCell className="py-4 text-right font-medium text-slate-300 text-sm tabular-nums">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.totalBarcode)}
                          </TableCell>
                          <TableCell className="py-4 text-right font-medium text-slate-300 text-sm tabular-nums">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.totalServiceCharge)}
                          </TableCell>
                          <TableCell className="py-4 text-right font-medium text-slate-300 text-sm tabular-nums">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.totalKukuluban)}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right font-black text-rose-400 text-base tabular-nums">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0
                            }).format(item.totalDeduction)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {adminTotalPages > 1 && (
            <div className="flex items-center justify-between p-6 border border-white/5 rounded-[2rem] bg-slate-900/40">
              <p className="text-xs text-slate-400 font-medium">
                Halaman {adminPage} dari {adminTotalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAdminPage(prev => Math.max(prev - 1, 1))}
                  disabled={adminPage === 1}
                  className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAdminPage(prev => Math.min(prev + 1, adminTotalPages))}
                  disabled={adminPage === adminTotalPages}
                  className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Supplier History Dialog for Admin */}
      <Dialog open={!!selectedSupplier} onOpenChange={(open) => { if (!open) setSelectedSupplier(null); }}>
        <DialogContent className="sm:max-w-5xl max-w-5xl w-[95vw] bg-zinc-950 border border-white/10 p-6 md:p-8 rounded-3xl text-white shadow-2xl">
          <DialogHeader className="border-b border-white/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white uppercase">
                    Riwayat Potongan: {selectedSupplier?.name}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs mt-0.5 font-medium">
                    Pemilik: {selectedSupplier?.ownerName || "-"}
                  </DialogDescription>
                </div>
              </div>
              <div className="text-left sm:text-right bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl shrink-0">
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block">Total Potongan</span>
                <span className="text-lg font-black text-white tabular-nums">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedSupplier?.totalDeduction || 0)}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-medium">Memuat riwayat potongan supplier...</p>
              </div>
            ) : !supplierHistoryData?.history || supplierHistoryData.history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 italic font-medium">
                Tidak ada riwayat potongan untuk supplier ini.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[60vh]">
                <Table>
                  <TableHeader className="bg-zinc-900/80 sticky top-0 backdrop-blur-md">
                    <TableRow className="border-white/10">
                      <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal</TableHead>
                      <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-slate-400">No. Nota</TableHead>
                      <TableHead className="py-3 text-right text-xs font-bold uppercase tracking-wider text-rose-400">Barcode</TableHead>
                      <TableHead className="py-3 text-right text-xs font-bold uppercase tracking-wider text-amber-400">S.Charge</TableHead>
                      <TableHead className="py-3 text-right text-xs font-bold uppercase tracking-wider text-purple-400">Kukuluban</TableHead>
                      <TableHead className="py-3 text-right px-6 text-xs font-bold uppercase tracking-wider text-white">Total Potongan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierHistoryData.history.map((h) => {
                      const totalRow = (h.barcode || 0) + (h.serviceCharge || 0) + (h.kukuluban || 0);
                      return (
                        <TableRow key={h.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                          <TableCell className="py-3.5 font-semibold text-white text-xs whitespace-nowrap">
                            {format(new Date(h.date), "dd MMM yyyy", { locale: localeId })}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg inline-block">
                              {h.noteNumber || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5 text-right text-xs text-rose-300 font-medium tabular-nums">
                            {new Intl.NumberFormat("id-ID").format(h.barcode || 0)}
                          </TableCell>
                          <TableCell className="py-3.5 text-right text-xs text-amber-300 font-medium tabular-nums">
                            {new Intl.NumberFormat("id-ID").format(h.serviceCharge || 0)}
                          </TableCell>
                          <TableCell className="py-3.5 text-right text-xs text-purple-300 font-medium tabular-nums">
                            {new Intl.NumberFormat("id-ID").format(h.kukuluban || 0)}
                          </TableCell>
                          <TableCell className="py-3.5 text-right px-6 font-black text-white text-sm tabular-nums">
                            {new Intl.NumberFormat("id-ID").format(totalRow)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
