"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/providers/session-provider";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Coins,
  History,
  ArrowUpDown,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Calendar,
  Banknote,
  Printer,
  Download
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";

interface SavingsDetail {
  id: string;
  date: string;
  tabungan: number;
  noteNumber: string | null;
  revenue: number;
  profit80: number;
}

interface SupplierSavings {
  id: string;
  name: string;
  ownerName: string;
  totalSavings: number;
}

export default function SavingsPage() {
  const { user } = useSession();
  const role = user?.role?.toUpperCase() || null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<SupplierSavings[]>([]);
  const [supplierData, setSupplierData] = useState<{ total: number; history: SavingsDetail[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "name", direction: "asc" });
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;
  const [adminPage, setAdminPage] = useState(1);
  const adminPerPage = 10;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierSavings | null>(null);
  const [supplierHistoryData, setSupplierHistoryData] = useState<{ total: number; history: SavingsDetail[]; supplier?: any } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleOpenSupplierHistory = async (supplier: SupplierSavings) => {
    setSelectedSupplier(supplier);
    setLoadingHistory(true);
    setSupplierHistoryData(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("supplierId", supplier.id);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      const res = await fetch(`/api/savings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSupplierHistoryData(data);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat tabungan supplier:", err);
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
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);
        const url = `/api/savings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const savingsRes = await fetch(url);
        if (!savingsRes.ok) {
          const errData = await savingsRes.json();
          throw new Error(errData.error || "Gagal mengambil data tabungan");
        }
        const savingsData = await savingsRes.json();

        if (role === "SUPPLIER") {
          setSupplierData(savingsData);
        } else {
          // Ensure it's an array for admin
          setAdminData(Array.isArray(savingsData) ? savingsData : []);
        }
      } catch (err) {
        console.error("Failed to fetch savings data:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
      } finally {
        setLoading(false);
      }
    };

    if (role) {
      fetchData();
    }
  }, [role, startDate, endDate]);

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
      const exportData = history.map((item, index) => ({
        No: index + 1,
        Tanggal: format(new Date(item.date), "dd/MM/yyyy"),
        "No. Nota": item.noteNumber || "-",
        Omzet: item.revenue,
        "Potongan Tabungan": item.tabungan
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tabungan");
      XLSX.writeFile(workbook, `Laporan_Tabungan_${user?.name || "Mitra"}_${format(new Date(), "yyyyMMdd")}.xlsx`);
    } else {
      if (filteredAdminData.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }
      const exportData = filteredAdminData.map((item, index) => ({
        No: index + 1,
        "Nama Mitra": item.name,
        "Pemilik": item.ownerName,
        "Total Tabungan": item.totalSavings
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tabungan");
      XLSX.writeFile(workbook, `Laporan_Tabungan_Mitra_${format(new Date(), "yyyyMMdd")}.xlsx`);
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
      const rowsHtml = (supplierData?.history || []).map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${format(new Date(item.date), "dd/MM/yyyy")}</td>
          <td>${item.noteNumber || "-"}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(item.revenue)}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(item.tabungan)}</td>
        </tr>
      `).join("");

      content = `
        <!DOCTYPE html>
        <html>
          <head>
            ${getHeadStyle(`Laporan Tabungan - ${user?.name}`)}
          </head>
          <body>
            ${getHeader("Laporan Tabungan Mitra")}
            <div class="meta-grid">
              <div class="meta-item"><span class="meta-label">Mitra:</span> <strong>${user?.name || "-"}</strong></div>
              <div class="meta-item"><span class="meta-label">Periode:</span> ${periodText}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th width="30">No</th>
                  <th>Tanggal</th>
                  <th>No. Nota</th>
                  <th align="right">Omzet</th>
                  <th align="right">Potongan Tabungan</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr class="total-row">
                  <td colspan="4" align="center">TOTAL TABUNGAN</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(supplierData?.total || 0)}</td>
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
          <td align="right">${new Intl.NumberFormat("id-ID").format(item.totalSavings)}</td>
        </tr>
      `).join("");

      const grandTotal = filteredAdminData.reduce((sum, item) => sum + item.totalSavings, 0);

      content = `
        <!DOCTYPE html>
        <html>
          <head>
            ${getHeadStyle("Laporan Tabungan Mitra")}
          </head>
          <body>
            ${getHeader("Laporan Akumulasi Tabungan Mitra")}
            <div class="meta-grid">
              <div class="meta-item"><span class="meta-label">Periode:</span> ${periodText}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th width="30">No</th>
                  <th class="col-nowrap">Nama Mitra</th>
                  <th class="col-nowrap">Pemilik</th>
                  <th align="right">Total Tabungan</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr class="total-row">
                  <td colspan="3" align="center">TOTAL KESELURUHAN</td>
                  <td align="right">${new Intl.NumberFormat("id-ID").format(grandTotal)}</td>
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
    const totalSavings = filteredAdminData.reduce(
      (acc, s) => acc + (Number(s.totalSavings) || 0),
      0
    );
    return {
      totalSavings,
      supplierCount: filteredAdminData.length,
    };
  }, [filteredAdminData]);

  // Paginated supplier history
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
                <div className="bg-card rounded-xl p-12 text-center border border-border shadow-sm">
                   <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                   <p className="text-muted-foreground font-medium">Memuat data tabungan...</p>
                </div>
    );
  }

  if (error) {
    return (
          <div className="mx-4 md:mx-0 flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <Banknote className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl md:text-3xl font-black text-foreground mb-2 md:mb-3">Tidak Ada Data Tabungan</h3>
        <p className="text-slate-400 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl">
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
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Tabungan Mitra
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium">Akumulasi potongan tabungan dari setiap transaksi setoran.</p>
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <Input
                placeholder="Cari Mitra / Pemilik..."
                className="pl-11 pr-4 h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium text-white w-full"
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
              <Printer className="w-4 h-4 text-purple-400" /> Cetak
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
            <Card className="border-white/5 bg-linear-to-br from-blue-600 to-indigo-700 overflow-hidden relative group shadow-2xl shadow-blue-500/20 rounded-3xl md:rounded-[2.5rem] mx-4 md:mx-0">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Coins size={140} className="text-white md:hidden" />
                <Coins size={180} className="text-white hidden md:block" />
              </div>
              <CardContent className="p-6 md:p-10 relative z-10">
                <div className="flex flex-col gap-2 text-center md:text-left">
                  <span className="text-blue-100 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">Total Tabungan Terkumpul</span>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-3">
                    <span className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0
                      }).format(supplierData.total || 0)}
                    </span>
                    <div className="flex items-center justify-center md:justify-start gap-1 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] md:text-xs font-bold w-fit mx-auto md:mx-0">
                      <TrendingUp size={14} />
                      Auto-Save
                    </div>
                  </div>
                  <p className="mt-4 text-blue-100/70 text-xs md:text-sm max-w-md font-medium leading-relaxed mx-auto md:mx-0">
                    Tabungan ini dipotong secara otomatis dari setiap omset penjualan harian Anda.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* History Mobile View */}
            <div className="md:hidden space-y-4 px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <History className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Riwayat Pemotongan</h3>
              </div>

              {!supplierData.history || supplierData.history.length === 0 ? (
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
                  <p className="text-slate-500 font-medium italic">Belum ada riwayat tabungan.</p>
                </div>
              ) : (
                <>
                {paginatedHistory.map((item) => (
                  <Card key={item.id} className="bg-card border-border rounded-xl overflow-hidden group shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</span>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <p className="text-sm font-bold text-slate-200">
                              {format(new Date(item.date), "dd MMM yyyy", { locale: localeId })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Potongan</span>
                          <span className="text-lg font-black text-blue-400">
                            +{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.tabungan)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">No. Nota</span>
                          <p className="text-sm font-mono font-bold text-slate-400">
                            {item.noteNumber || "—"}
                          </p>
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Omzet</span>
                          <p className="text-sm font-bold text-slate-400">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.revenue)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <History className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Riwayat Pemotongan</h3>
              </div>

              <Card className="border-border bg-card rounded-xl overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/2">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Tanggal</TableHead>
                          <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">No. Nota</TableHead>
                          <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Omzet</TableHead>
                          <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Bagi Hasil</TableHead>
                          <TableHead className="py-6 px-8 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Potongan Tabungan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!supplierData.history || supplierData.history.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-20 text-slate-500 font-medium italic">
                              Belum ada riwayat tabungan.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedHistory.map((item) => (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/2 transition-all duration-300 group">
                              <TableCell className="py-6 px-8">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
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
                                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.revenue)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-slate-400 text-sm">
                                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.profit80)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right px-8">
                                <span className="font-black text-lg text-blue-400">
                                  + {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    maximumFractionDigits: 0
                                  }).format(item.tabungan)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
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
            <Coins className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-500 font-medium italic">Data tabungan tidak ditemukan.</p>
          </div>
        )
      ) : (
        /* Admin View */
        <div className="px-4 md:px-0 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-5 md:p-6 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Akumulasi Tabungan</span>
                <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight tabular-nums block mt-1.5">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(adminTotals.totalSavings)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-5 md:p-6 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Supplier Memiliki Tabungan</span>
                <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight tabular-nums block mt-1.5">
                  {adminTotals.supplierCount} <span className="text-sm font-semibold text-slate-400">Supplier</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <UserIcon className="w-6 h-6" />
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
                          Nama Mitra <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-4 cursor-pointer group" onClick={() => handleSort("ownerName")}>
                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                          Pemilik <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-4 px-6 text-right cursor-pointer group" onClick={() => handleSort("totalSavings")}>
                        <div className="flex items-center justify-end gap-2 font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                          Total Tabungan <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAdminData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-24 text-slate-500 font-medium italic">
                          Tidak ada data tabungan mitra.
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
                          <TableCell className="py-4 px-6 text-right font-black text-blue-400 text-base tabular-nums">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0
                            }).format(item.totalSavings)}
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
            <div className="flex items-center justify-between p-6 border border-border rounded-xl bg-card">
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
        <DialogContent className="sm:max-w-4xl max-w-4xl w-[95vw] bg-zinc-950 border border-white/10 p-6 md:p-8 rounded-3xl text-white shadow-2xl">
          <DialogHeader className="border-b border-white/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white uppercase">
                    Riwayat Tabungan: {selectedSupplier?.name}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs mt-0.5 font-medium">
                    Pemilik: {selectedSupplier?.ownerName || "-"}
                  </DialogDescription>
                </div>
              </div>
              <div className="text-left sm:text-right bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-2xl shrink-0">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block">Total Tabungan</span>
                <span className="text-lg font-black text-white tabular-nums">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedSupplier?.totalSavings || 0)}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-medium">Memuat riwayat tabungan supplier...</p>
              </div>
            ) : !supplierHistoryData?.history || supplierHistoryData.history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 italic font-medium">
                Tidak ada riwayat tabungan untuk supplier ini.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[60vh]">
                <Table>
                  <TableHeader className="bg-zinc-900/80 sticky top-0 backdrop-blur-md">
                    <TableRow className="border-white/10">
                      <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal</TableHead>
                      <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-slate-400">No. Nota</TableHead>
                      <TableHead className="py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Omzet</TableHead>
                      <TableHead className="py-3 text-right px-6 text-xs font-bold uppercase tracking-wider text-blue-400">Potongan Tabungan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierHistoryData.history.map((h) => (
                      <TableRow key={h.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                        <TableCell className="py-3.5 font-semibold text-white text-xs whitespace-nowrap">
                          {format(new Date(h.date), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg inline-block">
                            {h.noteNumber || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 text-right text-xs text-slate-300 font-medium tabular-nums">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(h.revenue)}
                        </TableCell>
                        <TableCell className="py-3.5 text-right px-6 font-black text-blue-400 text-sm tabular-nums">
                          +{new Intl.NumberFormat("id-ID").format(h.tabungan)}
                        </TableCell>
                      </TableRow>
                    ))}
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
