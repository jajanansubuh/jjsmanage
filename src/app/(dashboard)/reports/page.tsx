"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download, Calendar as CalendarIcon, Printer, Pencil, Trash2, ShieldAlert, Loader2, Wallet, Coins, History, Save } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("transaksi");

  // Transaksi State
  const [reports, setReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [noteDetails, setNoteDetails] = useState<any[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);

  // Setoran State
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutSearch, setPayoutSearch] = useState("");

  // Tabungan State
  const [savings, setSavings] = useState<any[]>([]);
  const [savingsSearch, setSavingsSearch] = useState("");

  // Potongan State
  const [deductionSearch, setDeductionSearch] = useState("");

  // Modals State
  const [isDeductionModal, setIsDeductionModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteNoteNumber, setDeleteNoteNumber] = useState<string | null>(null);
  
  // Modal Setoran
  const [isSupplierSetoranModalOpen, setIsSupplierSetoranModalOpen] = useState(false);
  const [selectedSupplierForSetoran, setSelectedSupplierForSetoran] = useState<{name: string, data: any[]} | null>(null);

  // Delete Credentials
  const [deleteCredentials, setDeleteCredentials] = useState({ username: "", password: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, statsRes, payoutsRes, savingsRes] = await Promise.all([
        fetch("/api/reports?limit=2000"),
        fetch("/api/stats"),
        fetch("/api/payouts"),
        fetch("/api/savings")
      ]);

      const reportsData = await reportsRes.json();
      const statsData = await statsRes.json();
      const payoutsData = await payoutsRes.json();
      const savingsData = await savingsRes.json();

      setReports(Array.isArray(reportsData) ? reportsData : (reportsData.reports || []));
      setUserRole(statsData.role);
      setPayouts(Array.isArray(payoutsData) ? payoutsData : []);

      // Handle savings response based on role
      if (statsData.role === "SUPPLIER") {
        setSavings(savingsData?.history || []);
      } else {
        setSavings(Array.isArray(savingsData) ? savingsData : []);
      }
    } catch (err) {
      console.error("Failed to fetch archive data:", err);
      toast.error("Gagal memuat data arsip");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, [fetchData]);

  // Transaksi Memo
  const groupedReports = useMemo(() => {
    const groups: Record<string, any> = {};
    reports.forEach(report => {
      const key = report.noteNumber || `TANPA-NOTA-${report.id}`;
      if (!groups[key]) {
        groups[key] = {
          id: report.id,
          noteNumber: report.noteNumber,
          date: report.date || report.createdAt,
          revenue: 0,
          profit80: 0,
          profit20: 0,
          itemCount: 0,
          suppliers: [] as string[],
        };
      }
      groups[key].revenue += report.revenue;
      groups[key].profit80 += report.profit80;
      groups[key].profit20 += report.profit20;
      groups[key].itemCount += 1;
      if (report.supplier?.name && !groups[key].suppliers.includes(report.supplier.name)) {
        groups[key].suppliers.push(report.supplier.name);
      }
    });
    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports]);

  const filteredReports = groupedReports.filter(r => {
    const matchSearch =
      (r.noteNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.suppliers.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())));
    let matchDate = true;
    if (startDate || endDate) {
      const reportDate = new Date(r.date as string);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (reportDate < start) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (reportDate > end) matchDate = false;
      }
    }
    return matchSearch && matchDate;
  });

  // Setoran Memo (Validated Deposits grouped by date and supplier)
  const validatedDeposits = useMemo(() => {
    const groups: Record<string, any> = {};
    reports.forEach(r => {
      if (!r.isValidated) return;
      if (!r.supplier) return;

      const dateStr = format(new Date(r.date || r.createdAt), "yyyy-MM-dd");
      const key = `${dateStr}_${r.supplier.id}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          date: r.date || r.createdAt,
          supplierName: r.supplier.name,
          amount: 0,
          paymentMethod: r.supplier.bankName || "CASH"
        };
      }
      groups[key].amount += r.profit80;
    });

    return Object.values(groups)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(d => d.supplierName.toLowerCase().includes(payoutSearch.toLowerCase()));
  }, [reports, payoutSearch]);

  // Setoran Memo (Validated Deposits grouped by supplier ONLY)
  const validatedSuppliers = useMemo(() => {
    const groups: Record<string, any> = {};
    reports.forEach(r => {
      if (!r.isValidated) return;
      if (!r.supplier) return;

      const key = r.supplier.id;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          supplierName: r.supplier.name,
          amount: 0,
          paymentMethod: r.supplier.bankName || "CASH"
        };
      }
      groups[key].amount += r.profit80;
    });

    return Object.values(groups)
      .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
      .filter(d => d.supplierName.toLowerCase().includes(payoutSearch.toLowerCase()));
  }, [reports, payoutSearch]);

  // Tabungan Memo
  const filteredSavings = useMemo(() => {
    return savings.filter(s =>
      (s.name?.toLowerCase().includes(savingsSearch.toLowerCase())) ||
      (s.noteNumber?.toLowerCase().includes(savingsSearch.toLowerCase()))
    );
  }, [savings, savingsSearch]);

  // Potongan Memo (Grouped by deductionNoteNumber or noteNumber)
  const filteredDeductions = useMemo(() => {
    const groups: Record<string, any> = {};

    reports.forEach(r => {
      const hasDeduction = (r.serviceCharge || 0) > 0 || (r.kukuluban || 0) > 0 || (r.tabungan || 0) > 0;
      if (!hasDeduction) return;

      // Grouping logic:
      // 1. By deductionNoteNumber (the best way)
      // 2. By deductionDate (if saved together)
      // 3. By noteNumber (fallback)
      // @ts-ignore
      const dateKey = r.deductionDate ? new Date(r.deductionDate).toISOString().split('T')[0] : null;
      // @ts-ignore
      const key = r.deductionNoteNumber || (dateKey ? `DATE-${dateKey}` : r.noteNumber) || `DED-${r.id}`;

      if (!groups[key]) {
        groups[key] = {
          id: r.id,
          // @ts-ignore
          deductionNoteNumber: r.deductionNoteNumber,
          noteNumber: r.noteNumber,
          // @ts-ignore
          deductionDate: r.deductionDate || r.date || r.createdAt,
          date: r.date || r.createdAt,
          serviceCharge: 0,
          kukuluban: 0,
          tabungan: 0,
          supplierNames: [] as string[],
        };
      }

      groups[key].serviceCharge += (r.serviceCharge || 0);
      groups[key].kukuluban += (r.kukuluban || 0);
      groups[key].tabungan += (r.tabungan || 0);

      if (r.supplier?.name && !groups[key].supplierNames.includes(r.supplier.name)) {
        groups[key].supplierNames.push(r.supplier.name);
      }
    });

    return Object.values(groups).filter(g => {
      const matchSearch =
        (g.deductionNoteNumber?.toLowerCase().includes(deductionSearch.toLowerCase())) ||
        (g.noteNumber?.toLowerCase().includes(deductionSearch.toLowerCase())) ||
        (g.supplierNames.some((s: string) => s.toLowerCase().includes(deductionSearch.toLowerCase())));

      let matchDate = true;
      if (startDate || endDate) {
        const reportDate = new Date(g.deductionDate || g.date);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (reportDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (reportDate > end) matchDate = false;
        }
      }
      return matchSearch && matchDate;
    }).sort((a, b) => new Date(b.deductionDate || b.date).getTime() - new Date(a.deductionDate || a.date).getTime());
  }, [reports, deductionSearch, startDate, endDate]);

  const handleExportExcel = () => {
    let exportData: any[] = [];
    let fileName = "";

    if (activeTab === "transaksi") {
      if (filteredReports.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }
      exportData = filteredReports.map((r, i) => ({
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
      if (validatedSuppliers.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }
      exportData = validatedSuppliers.map((p: any, i: number) => ({
        No: i + 1,
        Mitra: p.supplierName || "-",
        Jumlah: p.amount,
        Metode: p.paymentMethod || "-"
      }));
      fileName = `Arsip_Setoran_${format(new Date(), "yyyyMMdd")}`;
    } else if (activeTab === "tabungan") {
      if (filteredSavings.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }
      exportData = filteredSavings.map((s, i) => ({
        No: i + 1,
        Tanggal: s.date ? format(new Date(s.date), "dd/MM/yyyy") : "-",
        "Nama/Suplier": s.name || "-",
        "No Nota": s.noteNumber || "-",
        "Jumlah Tabungan": s.tabungan || s.totalSavings || 0
      }));
      fileName = `Arsip_Tabungan_${format(new Date(), "yyyyMMdd")}`;
    } else if (activeTab === "potongan") {
      if (filteredDeductions.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }
      exportData = filteredDeductions.map((d, i) => ({
        No: i + 1,
        Tanggal: format(new Date(d.date || d.createdAt), "dd/MM/yyyy"),
        "No Nota": d.noteNumber || "-",
        Suplier: d.supplier?.name || "-",
        "Service Charge": d.serviceCharge || 0,
        Kukuluban: d.kukuluban || 0,
        Tabungan: d.tabungan || 0,
        Total: (d.serviceCharge || 0) + (d.kukuluban || 0) + (d.tabungan || 0)
      }));
      fileName = `Arsip_Potongan_${format(new Date(), "yyyyMMdd")}`;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Archive");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    toast.success("Export berhasil");
  };

  const handleDelete = async () => {
    if (!deleteNoteNumber || !deleteCredentials.username || !deleteCredentials.password) {
      setDeleteError("Harap isi username dan password");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/reports/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteNumber: deleteNoteNumber,
          username: deleteCredentials.username,
          password: deleteCredentials.password
        })
      });
      if (res.ok) {
        toast.success("Transaksi berhasil dihapus");
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        const result = await res.json();
        setDeleteError(result.error || "Gagal menghapus");
      }
    } catch (err) {
      setDeleteError("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Arsip <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">JjsManage</span>
          </h2>
          <p className="text-slate-400 font-medium">Riwayat lengkap transaksi harian, setoran tunai, dan akumulasi tabungan mitra.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleExportExcel} className="h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 shadow-xl transition-all active:scale-95">
            <Download className="w-5 h-5 mr-2 text-blue-400" /> Export Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="transaksi" className="space-y-8" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/50 border border-white/5 p-1.5 rounded-2xl !h-14 w-full md:w-auto flex items-center">
          <TabsTrigger value="transaksi" className={`flex-1 h-full !py-3 md:px-8 rounded-xl font-bold transition-all ${activeTab === "transaksi" ? "!bg-blue-600 !text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:text-white"}`}>
            <FileText className="w-4 h-4 mr-2" /> Transaksi
          </TabsTrigger>
          <TabsTrigger value="setoran" className={`flex-1 h-full !py-3 md:px-8 rounded-xl font-bold transition-all ${activeTab === "setoran" ? "!bg-indigo-600 !text-white shadow-lg shadow-indigo-900/50" : "text-slate-400 hover:text-white"}`}>
            <Wallet className="w-4 h-4 mr-2" /> Setoran
          </TabsTrigger>
          <TabsTrigger value="tabungan" className={`flex-1 h-full !py-3 md:px-8 rounded-xl font-bold transition-all ${activeTab === "tabungan" ? "!bg-purple-600 !text-white shadow-lg shadow-purple-900/50" : "text-slate-400 hover:text-white"}`}>
            <Coins className="w-4 h-4 mr-2" /> Tabungan
          </TabsTrigger>
          <TabsTrigger value="potongan" className={`flex-1 h-full !py-3 md:px-8 rounded-xl font-bold transition-all ${activeTab === "potongan" ? "!bg-rose-600 !text-white shadow-lg shadow-rose-900/50" : "text-slate-400 hover:text-white"}`}>
            <History className="w-4 h-4 mr-2" /> Potongan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transaksi" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border border-white/5 border-t-4 border-t-blue-500 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10">
            <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" /> Riwayat Transaksi
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium mt-1">Dikelompokkan berdasarkan nomor nota.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5 h-12">
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-[10px] font-black uppercase text-slate-500">Filter:</span>
                    <Popover>
                      <PopoverTrigger className="text-xs font-bold text-white">
                        {startDate ? format(new Date(startDate), "dd/MM/yy") : "Mulai"} - {endDate ? format(new Date(endDate), "dd/MM/yy") : "Akhir"}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="end">
                        <div className="p-4 flex gap-4">
                          <Calendar mode="single" selected={startDate ? new Date(startDate) : undefined} onSelect={(d) => d && setStartDate(format(d, "yyyy-MM-dd"))} className="text-white" />
                          <Calendar mode="single" selected={endDate ? new Date(endDate) : undefined} onSelect={(d) => d && setEndDate(format(d, "yyyy-MM-dd"))} className="text-white" />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input placeholder="Cari nota..." className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5">
                    <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Tanggal</TableHead>
                    <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No Nota</TableHead>
                    <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Mitra Jjs</TableHead>
                    <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Toko</TableHead>
                    <TableHead className="py-5 text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-500">Memuat...</TableCell></TableRow>
                  ) : filteredReports.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-500 italic">Tidak ada data.</TableCell></TableRow>
                  ) : (
                    filteredReports.map((r) => (
                      <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => {
                        setSelectedNote(r.noteNumber);
                        setIsNoteModalOpen(true);
                        setIsDeductionModal(false);
                        setNoteDetails(reports.filter(item => item.noteNumber === r.noteNumber));
                      }}>
                        <TableCell className="py-5 px-8 font-bold text-white">{format(new Date(r.date), "dd MMM yyyy", { locale: id })}</TableCell>
                        <TableCell className="font-black text-blue-400">{r.noteNumber || "-"}</TableCell>
                        <TableCell className="text-emerald-400 font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.profit80)}</TableCell>
                        <TableCell className="text-blue-400 font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.profit20)}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" size="icon" className="hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDeleteNoteNumber(r.noteNumber); setIsDeleteModalOpen(true); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setoran" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border border-white/5 border-t-4 border-t-indigo-500 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/10">
            <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-400" /> Riwayat Setoran (Tervalidasi)
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium mt-1">Daftar setoran / pendapatan mitra yang sudah divalidasi.</CardDescription>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input placeholder="Cari mitra..." className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-indigo-500/20" value={payoutSearch} onChange={(e) => setPayoutSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5">
                    <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Mitra</TableHead>
                    <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Jumlah Setoran</TableHead>
                    <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Metode</TableHead>
                    <TableHead className="py-5 text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validatedSuppliers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-500 italic">Belum ada riwayat setoran.</TableCell></TableRow>
                  ) : (
                    validatedSuppliers.map((p) => (
                      <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => {
                        setSelectedSupplierForSetoran({
                          name: p.supplierName,
                          data: validatedDeposits.filter(d => d.supplierName === p.supplierName)
                        });
                        setIsSupplierSetoranModalOpen(true);
                      }}>
                        <TableCell className="py-5 px-8 font-black text-indigo-400 uppercase">{p.supplierName}</TableCell>
                        <TableCell className="font-bold text-white">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.amount)}</TableCell>
                        <TableCell className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{p.paymentMethod}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-500/20 hover:text-indigo-400">
                            <History className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tabungan" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border border-white/5 border-t-4 border-t-purple-500 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-900/10">
            <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-purple-400" /> Riwayat Tabungan
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium mt-1">Potongan tabungan otomatis dari setiap transaksi.</CardDescription>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                <Input placeholder="Cari..." className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-purple-500/20" value={savingsSearch} onChange={(e) => setSavingsSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5">
                    <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Tanggal / Suplier</TableHead>
                    <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No Nota</TableHead>
                    <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">Omzet</TableHead>
                    <TableHead className="py-5 text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-500 text-purple-400">Potongan Tabungan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRole === "SUPPLIER" ? (
                    filteredSavings.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-500 italic">Belum ada riwayat tabungan.</TableCell></TableRow>
                    ) : (
                      filteredSavings.map((s) => (
                        <TableRow key={s.id} className="border-white/5">
                          <TableCell className="py-5 px-8 font-bold text-white">{format(new Date(s.date), "dd MMM yyyy")}</TableCell>
                          <TableCell className="font-mono text-slate-500">{s.noteNumber}</TableCell>
                          <TableCell className="text-right font-bold text-white">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.revenue)}</TableCell>
                          <TableCell className="text-right px-8 font-black text-purple-400 text-lg">+ {new Intl.NumberFormat("id-ID").format(s.tabungan)}</TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    filteredSavings.map((s) => (
                      <TableRow key={s.id} className="border-white/5">
                        <TableCell className="py-5 px-8">
                          <div className="flex flex-col">
                            <span className="font-black text-white uppercase">{s.name}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.ownerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-slate-500">TOTAL</TableCell>
                        <TableCell className="text-right text-slate-500 font-bold">Accumulated</TableCell>
                        <TableCell className="text-right px-8 font-black text-purple-400 text-lg">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.totalSavings)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="potongan" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border border-white/5 border-t-4 border-t-rose-500 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl shadow-rose-900/10">
            <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-rose-400" /> Riwayat Potongan
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium mt-1">Arsip rincian biaya layanan dan iuran mitra.</CardDescription>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                <Input placeholder="Cari suplier/nota..." className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-rose-500/20" value={deductionSearch} onChange={(e) => setDeductionSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5">
                    <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Tanggal</TableHead>
                    <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No. Nota</TableHead>
                    <TableHead className="py-5 text-right font-black text-[10px] uppercase tracking-widest text-rose-400">S.Charge</TableHead>
                    <TableHead className="py-5 text-right font-black text-[10px] uppercase tracking-widest text-orange-400">Kukuluban</TableHead>
                    <TableHead className="py-5 text-right font-black text-[10px] uppercase tracking-widest text-purple-400">Tabungan</TableHead>
                    <TableHead className="py-5 text-right px-8 font-black text-[10px] uppercase tracking-widest text-white">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeductions.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500 italic">Tidak ada riwayat potongan dalam periode ini.</TableCell></TableRow>
                  ) : (
                    filteredDeductions.map((d) => {
                      const totalDeduction = (d.serviceCharge || 0) + (d.kukuluban || 0) + (d.tabungan || 0);
                      return (
                        <TableRow
                          key={d.id}
                          className="border-white/5 hover:bg-white/[0.02] cursor-pointer"
                          onClick={() => {
                            // @ts-ignore
                            const targetNote = d.deductionNoteNumber || d.noteNumber;
                            setSelectedNote(targetNote);
                            setNoteDetails(reports.filter(item =>
                              item.noteNumber === targetNote ||
                              // @ts-ignore
                              item.deductionNoteNumber === targetNote
                            ));
                            setIsNoteModalOpen(true);
                            setIsDeductionModal(true);
                          }}
                        >

                          <TableCell className="py-5 px-8 font-bold text-white whitespace-nowrap">
                            {format(new Date(d.deductionDate || d.date || d.createdAt), "dd MMM yy")}
                          </TableCell>
                          <TableCell className="font-black text-blue-400">
                            {
                              // @ts-ignore
                              d.deductionNoteNumber || (d.deductionDate ? `POT-${format(new Date(d.deductionDate), "ddMMyy")}` : d.noteNumber || "-")
                            }
                          </TableCell>

                          <TableCell className="text-right font-bold text-rose-400">{new Intl.NumberFormat("id-ID").format(d.serviceCharge || 0)}</TableCell>
                          <TableCell className="text-right font-bold text-orange-400">{new Intl.NumberFormat("id-ID").format(d.kukuluban || 0)}</TableCell>
                          <TableCell className="text-right font-bold text-purple-400">{new Intl.NumberFormat("id-ID").format(d.tabungan || 0)}</TableCell>
                          <TableCell className="text-right px-8 font-black text-white">{new Intl.NumberFormat("id-ID").format(totalDeduction)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supplier Setoran Details Modal */}
      <Dialog open={isSupplierSetoranModalOpen} onOpenChange={setIsSupplierSetoranModalOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
              <History className="w-6 h-6 text-indigo-400" />
              Detail Setoran
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Rincian setoran yang sudah divalidasi untuk <span className="text-indigo-400 font-bold">{selectedSupplierForSetoran?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-white/5">
                  <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</TableHead>
                  <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Jumlah Setoran</TableHead>
                  <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Metode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedSupplierForSetoran?.data.map((d: any, idx: number) => (
                  <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="py-4 px-6 font-bold text-white">{format(new Date(d.date), "dd MMMM yyyy", { locale: id })}</TableCell>
                    <TableCell className="py-4 text-right font-black text-emerald-400">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(d.amount)}</TableCell>
                    <TableCell className="py-4 px-6 text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">{d.paymentMethod}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Nota Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="p-8 border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" /> {isDeductionModal ? "Detail Potongan:" : "Detail Nota:"} {selectedNote}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-auto p-8">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5">
                  <TableHead className="text-[10px] font-black uppercase text-slate-500">Nota</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-500">Suplier</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Pendapatan</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">S.Charge</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Kukuluban</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Tabungan</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 text-emerald-400">Net Mitra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {noteDetails.map((d) => (
                  <TableRow key={d.id} className="border-white/5">
                    <TableCell className="font-mono text-[10px] text-slate-500">{d.noteNumber || "-"}</TableCell>
                    <TableCell className="font-bold text-white">{d.supplier?.name}</TableCell>
                    <TableCell className="text-right text-slate-300">{new Intl.NumberFormat("id-ID").format(d.revenue)}</TableCell>
                    <TableCell className="text-right text-slate-400">{new Intl.NumberFormat("id-ID").format(d.serviceCharge || 0)}</TableCell>
                    <TableCell className="text-right text-slate-400">{new Intl.NumberFormat("id-ID").format(d.kukuluban || 0)}</TableCell>
                    <TableCell className="text-right text-slate-400">{new Intl.NumberFormat("id-ID").format(d.tabungan || 0)}</TableCell>
                    <TableCell className="text-right font-black text-emerald-400">{new Intl.NumberFormat("id-ID").format(d.profit80)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-6 border-t border-white/5 flex justify-end gap-3">
            {userRole !== "SUPPLIER" && (
              <Button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  if (isDeductionModal) {
                    router.push("/potongan");
                  } else {
                    router.push(`/transactions?edit=${selectedNote}`);
                  }
                }}
                className={`${isDeductionModal ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"} text-white font-bold rounded-xl h-11 px-6`}
              >
                {isDeductionModal ? <Save className="w-4 h-4 mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                {isDeductionModal ? "Edit Potongan" : "Edit Transaksi"}
              </Button>
            )}
            <Button onClick={() => setIsNoteModalOpen(false)} className="bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-11 px-8">Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-3xl max-w-md">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20"><ShieldAlert className="w-8 h-8 text-red-500" /></div>
              <DialogHeader><DialogTitle className="text-xl font-black text-white">Hapus Nota?</DialogTitle></DialogHeader>
              <p className="text-slate-400">Masukkan kredensial admin untuk menghapus nota <strong>{deleteNoteNumber}</strong>.</p>
            </div>
            <div className="space-y-4">
              <Input placeholder="Username Admin" value={deleteCredentials.username} onChange={(e) => setDeleteCredentials({ ...deleteCredentials, username: e.target.value })} className="bg-white/5 border-white/5 h-12" />
              <Input type="password" placeholder="Password" value={deleteCredentials.password} onChange={(e) => setDeleteCredentials({ ...deleteCredentials, password: e.target.value })} className="bg-white/5 border-white/5 h-12" onKeyDown={(e) => e.key === "Enter" && handleDelete()} />
              {deleteError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">{deleteError}</div>}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 text-slate-400 font-bold">Batal</Button>
              <Button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black">{isDeleting ? "..." : "HAPUS"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
