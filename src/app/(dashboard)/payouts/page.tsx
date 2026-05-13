"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { 
  History, 
  Clock, 
  ArrowLeft,
  Search,
  ArrowUpDown,
  Calendar as CalendarIcon,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Scissors,
  Barcode,
  PiggyBank,
  Wrench
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TransactionRecord {
  id: string;
  date: string;
  noteNumber: string | null;
  revenue: number;
  profit80: number;
  profit20: number;
  cost: number;
  barcode: number;
  serviceCharge: number | null;
  kukuluban: number | null;
  tabungan: number | null;
  notes: string | null;
  supplier: {
    id: string;
    name: string;
  };
}

function DeductionBadge({ icon: Icon, label, value, colorClass }: { icon: any; label: string; value: number; colorClass: string }) {
  if (!value || value === 0) return null;
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border", colorClass)}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
        <span className="text-sm font-black tracking-tight">
          -{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value)}
        </span>
      </div>
    </div>
  );
}

export default function PayoutsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const [res, statsRes] = await Promise.all([
          fetch(`/api/reports?${params.toString()}`),
          fetch("/api/stats")
        ]);
        
        if (res.ok) {
          const data = await res.json();
          // Handle both old array format and new paginated object format
          const reportsData = Array.isArray(data) ? data : (data.reports || []);
          setTransactions(reportsData);
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setUserRole(statsData.role);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...transactions];

    if (selectedMonth) {
      const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);
      result = result.filter((t) => {
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd;
      });
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((t) =>
        (t.noteNumber && t.noteNumber.toLowerCase().includes(lower)) ||
        (userRole !== "SUPPLIER" && t.notes && t.notes.toLowerCase().includes(lower)) ||
        (t.supplier?.name && t.supplier.name.toLowerCase().includes(lower))
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        switch (sortConfig.key) {
          case "date": valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); break;
          case "noteNumber": valA = a.noteNumber || ""; valB = b.noteNumber || ""; break;
          case "revenue": valA = a.revenue; valB = b.revenue; break;
          case "profit80": valA = a.profit80; valB = b.profit80; break;
          default: valA = ""; valB = "";
        }
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [transactions, searchTerm, selectedMonth, sortConfig, userRole]);

  const totalProfit80 = useMemo(() => filteredAndSorted.reduce((sum, t) => sum + t.profit80, 0), [filteredAndSorted]);
  const totalRevenue = useMemo(() => filteredAndSorted.reduce((sum, t) => sum + t.revenue, 0), [filteredAndSorted]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  const hasDeductions = (t: TransactionRecord) =>
    (t.barcode && t.barcode > 0) || 
    (t.serviceCharge && t.serviceCharge > 0) || 
    (t.kukuluban && t.kukuluban > 0) || 
    (t.tabungan && t.tabungan > 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10 px-0 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-slate-500 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Finansial</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Riwayat <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-orange-400">Transaksi</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium">Seluruh riwayat transaksi consignment yang diinput oleh Admin.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5 w-full sm:w-auto">
            <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group flex-1 sm:flex-none">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bulan</span>
                <Popover>
                  <PopoverTrigger className="flex items-center gap-2 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto bg-transparent border-none">
                    <CalendarIcon className="w-4 h-4 text-amber-400" />
                    {selectedMonth
                      ? format(selectedMonth, "MMMM yyyy", { locale: id })
                      : "Semua"}
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-2rem)] md:w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => setSelectedMonth(date)}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {selectedMonth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMonth(undefined)}
                className="text-xs text-slate-400 hover:text-white px-2 rounded-xl"
              >
                Reset
              </Button>
            )}
          </div>

          <div className="relative group w-full md:w-56">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
            <Input 
              placeholder={userRole === "SUPPLIER" ? "Cari nota..." : "Cari nota/catatan..."} 
              className="pl-11 pr-4 h-11 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-amber-500/20 focus:border-amber-500/50 transition-all font-medium text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 px-4 md:px-0">
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-400/10 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Transaksi</p>
              <p className="text-xl md:text-2xl font-black text-white">{filteredAndSorted.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-400/10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Omzet</p>
              <p className="text-xl md:text-2xl font-black text-white">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-400/10 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Mitra Jjs</p>
              <p className="text-xl md:text-2xl font-black text-emerald-400">{formatCurrency(totalProfit80)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List Mobile */}
      <div className="md:hidden space-y-4 px-4">
        {loading ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
             <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
             <p className="text-slate-500 font-medium">Memuat riwayat...</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
            <p className="text-slate-500 font-medium italic">Belum ada riwayat transaksi.</p>
          </div>
        ) : (
          filteredAndSorted.map((t) => {
            const isExpanded = expandedRows.has(t.id);
            const showExpandButton = hasDeductions(t);
            return (
              <Card key={t.id} className={cn(
                "bg-slate-900/40 border-white/5 rounded-2xl overflow-hidden transition-all duration-300",
                isExpanded && "ring-1 ring-amber-500/30"
              )}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">No. Nota</span>
                      <p className="font-mono font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded text-sm w-fit">
                        {t.noteNumber || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Mitra Jjs</span>
                      <span className="text-lg font-black text-emerald-400">
                        +{formatCurrency(t.profit80)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</span>
                      <p className="text-sm font-bold text-slate-300">
                        {format(new Date(t.date), "dd MMM yyyy", { locale: id })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Waktu</span>
                      <p className="text-sm font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(new Date(t.date), "HH:mm")} WIB
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Omzet</span>
                      <p className="text-sm font-bold text-slate-400">
                        {formatCurrency(t.revenue)}
                      </p>
                    </div>
                    {showExpandButton && (
                      <div className="flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(t.id)}
                          className={cn(
                            "h-8 px-3 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            isExpanded ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-slate-400"
                          )}
                        >
                          Detail {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <Scissors className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Potongan</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <DeductionBadge icon={Barcode} label="Barcode" value={t.barcode} colorClass="bg-rose-500/10 border-rose-500/20 text-rose-400" />
                        <DeductionBadge icon={Wrench} label="S. Charge" value={t.serviceCharge || 0} colorClass="bg-orange-500/10 border-orange-500/20 text-orange-400" />
                        <DeductionBadge icon={Scissors} label="Kukuluban" value={t.kukuluban || 0} colorClass="bg-purple-500/10 border-purple-500/20 text-purple-400" />
                        <DeductionBadge icon={PiggyBank} label="Tabungan" value={t.tabungan || 0} colorClass="bg-sky-500/10 border-sky-500/20 text-sky-400" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Transaction Table Desktop */}
      <Card className="hidden md:block border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10 mx-4 md:mx-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-6 pl-8 pr-2 w-10">
                    <span className="sr-only">Detail</span>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("date")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Tanggal <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("noteNumber")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      No. Nota <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </TableHead>
                  {userRole !== "SUPPLIER" && (
                    <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Catatan</TableHead>
                  )}
                  <TableHead className="py-6 px-4 text-right cursor-pointer group" onClick={() => handleSort("revenue")}>
                    <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Omzet <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 px-8 text-right cursor-pointer group" onClick={() => handleSort("profit80")}>
                    <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Mitra Jjs <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="text-center py-24 text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">Memuat riwayat transaksi...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="text-center py-24 text-slate-500 font-medium italic">
                      Belum ada riwayat transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map((t) => {
                    const isExpanded = expandedRows.has(t.id);
                    const showExpandButton = hasDeductions(t);
                    
                    return (
                      <Fragment key={t.id}>
                        <TableRow 
                          key={t.id} 
                          className={cn(
                            "border-white/5 transition-all duration-300 group",
                            showExpandButton ? "cursor-pointer hover:bg-white/[0.03]" : "hover:bg-white/[0.02]",
                            isExpanded && "bg-white/[0.03]"
                          )}
                          onClick={() => showExpandButton && toggleRow(t.id)}
                        >
                          <TableCell className="py-5 pl-8 pr-2">
                            {showExpandButton ? (
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300",
                                isExpanded ? "bg-amber-500/20 text-amber-400 rotate-0" : "bg-white/5 text-slate-500"
                              )}>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                            ) : (
                              <div className="w-6 h-6" />
                            )}
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex flex-col">
                              <span className="font-black text-white group-hover:text-amber-400 transition-colors">
                                {format(new Date(t.date), "dd MMMM yyyy", { locale: id })}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(t.date), "HH:mm")} WIB
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            {t.noteNumber ? (
                              <span className="font-mono font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg text-sm">
                                {t.noteNumber}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic text-sm">—</span>
                            )}
                          </TableCell>
                          {userRole !== "SUPPLIER" && (
                            <TableCell className="py-5">
                              <span className="text-slate-400 text-sm font-medium">
                                {t.notes || "Transaksi Consignment"}
                              </span>
                            </TableCell>
                          )}
                          <TableCell className="py-5 px-4 text-right">
                            <span className="font-bold text-slate-300 tracking-tight">
                              {formatCurrency(t.revenue)}
                            </span>
                          </TableCell>
                          <TableCell className="py-5 px-8 text-right">
                            <span className="font-black text-lg tracking-tighter text-emerald-400 group-hover:scale-105 inline-block origin-right transition-transform">
                              +{formatCurrency(t.profit80)}
                            </span>
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <TableRow key={`${t.id}-detail`} className="border-white/5 bg-white/[0.01]">
                            <TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="py-0">
                              <div className="py-4 px-8 animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="flex items-center gap-2 mb-3">
                                  <Scissors className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Detail Potongan</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  <DeductionBadge
                                    icon={Barcode}
                                    label="Barcode"
                                    value={t.barcode}
                                    colorClass="bg-rose-500/10 border-rose-500/20 text-rose-400"
                                  />
                                  <DeductionBadge
                                    icon={Wrench}
                                    label="Service Charge"
                                    value={t.serviceCharge || 0}
                                    colorClass="bg-orange-500/10 border-orange-500/20 text-orange-400"
                                  />
                                  <DeductionBadge
                                    icon={Scissors}
                                    label="Kukuluban"
                                    value={t.kukuluban || 0}
                                    colorClass="bg-purple-500/10 border-purple-500/20 text-purple-400"
                                  />
                                  <DeductionBadge
                                    icon={PiggyBank}
                                    label="Tabungan"
                                    value={t.tabungan || 0}
                                    colorClass="bg-sky-500/10 border-sky-500/20 text-sky-400"
                                  />

                                  {/* HPP & Profit Toko for full context */}
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-500/10 border-slate-500/20 text-slate-400">
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">HPP</span>
                                      <span className="text-sm font-black tracking-tight">
                                        {formatCurrency(t.cost)}
                                      </span>
                                    </div>
                                  </div>
                                  </div>
                                </div>
                              </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer total */}
          {!loading && filteredAndSorted.length > 0 && (
            <div className="border-t border-white/5 bg-white/[0.02] px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-bold text-slate-400">
                Menampilkan {filteredAndSorted.length} transaksi
              </span>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Omzet</p>
                  <p className="text-base md:text-lg font-black text-white">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Mitra Jjs</p>
                  <p className="text-base md:text-lg font-black text-emerald-400">{formatCurrency(totalProfit80)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
