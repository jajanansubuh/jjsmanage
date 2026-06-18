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
  AlertCircle
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";

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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;
  const [adminPage, setAdminPage] = useState(1);
  const adminPerPage = 10;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            className="w-full sm:w-72 h-12 bg-slate-950/40"
          />

          {role !== "SUPPLIER" && (
            <div className="relative group w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Cari Mitra / Pemilik..."
                className="pl-11 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
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
        /* Admin View */
        <div className="px-4 md:px-0 space-y-4">
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/2">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="py-6 px-8 cursor-pointer group" onClick={() => handleSort("name")}>
                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                          Nama Mitra <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("ownerName")}>
                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                          Pemilik <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-6 text-right cursor-pointer group" onClick={() => handleSort("totalBarcode")}>
                        <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                          Barcode <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-6 text-right cursor-pointer group" onClick={() => handleSort("totalServiceCharge")}>
                        <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                          S.Charge <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-6 text-right cursor-pointer group" onClick={() => handleSort("totalKukuluban")}>
                        <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                          Kukuluban <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-rose-400 transition-colors" />
                        </div>
                      </TableHead>
                      <TableHead className="py-6 px-8 text-right cursor-pointer group" onClick={() => handleSort("totalDeduction")}>
                        <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                          Total Potongan <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-rose-400 transition-colors" />
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
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/2 transition-all duration-300 group">
                          <TableCell className="py-6 px-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UserIcon className="w-5 h-5 text-rose-400" />
                              </div>
                              <span className="font-black text-lg text-white tracking-tight group-hover:text-rose-400 transition-colors uppercase">
                                {item.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                              {item.ownerName}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-slate-300">
                              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.totalBarcode)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-slate-300">
                              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.totalServiceCharge)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-slate-300">
                              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.totalKukuluban)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-xl tracking-tighter text-rose-400 transition-all duration-300 group-hover:scale-105 inline-block origin-right">
                                {new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  minimumFractionDigits: 0
                                }).format(item.totalDeduction)}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                Accumulated <TrendingUp size={10} className="text-rose-500" />
                              </div>
                            </div>
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
    </div>
  );
}
