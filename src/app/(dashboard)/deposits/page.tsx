"use client";

import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Wallet, ArrowUpDown, History, Calendar as CalendarIcon, Printer, Eye, Filter, CheckCircle2, AlertCircle, Loader2, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PayoutHistoryModal } from "@/components/payout-history-modal";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DepositItem {
  id: string;
  name: string;
  ownerName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  dailyProfit: number;
  isValidated: boolean;
}

export default function DepositsPage() {
  const [data, setData] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [bankFilter, setBankFilter] = useState<string>("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof DepositItem; direction: "asc" | "desc" } | null>({ key: "dailyProfit", direction: "desc" });
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string, name: string } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isConfirmAllOpen, setIsConfirmAllOpen] = useState(false);
  const [unvalidatedIds, setUnvalidatedIds] = useState<string[]>([]);
  const [isValidatingAll, setIsValidatingAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
    params.append("limit", "2000");

    Promise.all([
      fetch('/api/auth/role').then(res => res.json()),
      fetch(`/api/reports?${params.toString()}`).then(res => res.json())
    ])
      .then(([roleData, reportsData]) => {
        const userRole = roleData.role;
        setRole(userRole);

        const reports = Array.isArray(reportsData) ? reportsData : (reportsData.reports || []);
        if (Array.isArray(reports)) {
          if (userRole === "SUPPLIER") {
            // For supplier, show individual validated reports as history
            const history = reports
              .filter((r: any) => r.isValidated)
              .map((r: any) => ({
                id: r.id,
                name: r.noteNumber || `Nota #${r.id.slice(-4)}`,
                ownerName: format(new Date(r.date), "dd MMM yyyy", { locale: localeId }),
                bankName: format(new Date(r.date), "HH:mm") + " WIB",
                accountNumber: r.noteNumber || "-",
                dailyProfit: Number(r.profit80 || 0),
                isValidated: true,
                rawDate: r.date,
                supplier: r.supplier
              }));
            setData(history);
          } else {
            // Group by supplier and sum profit80 (Mitra Jjs share)
            const grouped: Record<string, DepositItem> = {};

            reports.forEach((r: any) => {
              const s = r.supplier;
              if (!s) return;

              if (!grouped[s.id]) {
                grouped[s.id] = {
                  id: s.id,
                  name: s.name,
                  ownerName: s.ownerName,
                  bankName: s.bankName,
                  accountNumber: s.accountNumber,
                  dailyProfit: 0,
                  isValidated: true
                };
              }
              grouped[s.id].dailyProfit += Number(r.profit80 || 0);
              if (!r.isValidated) {
                grouped[s.id].isValidated = false;
              }
            });

            setData(Object.values(grouped));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setLoading(false);
      });
  }, [dateRange]);

  const handleSort = (key: keyof DepositItem) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data].filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (bankFilter === "CASH") {
        const name = (s.bankName || "").toUpperCase();
        return name === "" || name === "CASH" || name === "TUNAI" || name === "-";
      }

      if (bankFilter === "BANK") {
        const name = (s.bankName || "").toUpperCase();
        return name !== "" && name !== "CASH" && name !== "TUNAI" && name !== "-";
      }

      return true;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB, 'id', { sensitivity: 'base' })
            : valB.localeCompare(valA, 'id', { sensitivity: 'base' });
        }

        const numA = Number(valA);
        const numB = Number(valB);

        if (isNaN(numA) || isNaN(numB)) {
          // Fallback to string comparison if not numbers
          const strA = String(valA);
          const strB = String(valB);
          return sortConfig.direction === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }

        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, bankFilter]);

  const getSortIcon = (key: keyof DepositItem) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />;
    return sortConfig.direction === "asc" ? <ArrowUpDown className="w-3 h-3 text-emerald-400" /> : <ArrowUpDown className="w-3 h-3 text-emerald-400 rotate-180" />;
  };

  const handleValidateAllClick = () => {
    const ids = filteredAndSortedData
      .filter(item => !item.isValidated)
      .map(item => item.id);

    if (ids.length === 0) {
      alert("Tidak ada data yang perlu divalidasi.");
      return;
    }
    setUnvalidatedIds(ids);
    setIsConfirmAllOpen(true);
  };

  const executeValidateAll = async () => {
    setIsValidatingAll(true);
    try {
      const res = await fetch("/api/reports/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierIds: unvalidatedIds,
          startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Gagal memvalidasi setoran massal.");
        setIsValidatingAll(false);
        setIsConfirmAllOpen(false);
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
      setIsValidatingAll(false);
      setIsConfirmAllOpen(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const formattedFrom = dateRange?.from ? format(dateRange.from, "dd MMM yyyy", { locale: localeId }) : "";
    const formattedTo = dateRange?.to ? format(dateRange.to, "dd MMM yyyy", { locale: localeId }) : "";
    const rangeText = formattedFrom === formattedTo ? formattedFrom : `${formattedFrom} - ${formattedTo}`;

    // Pastikan data yang dicetak selalu urut A-Z berdasarkan nama UMKM
    const dataToPrint = [...filteredAndSortedData].sort((a, b) =>
      a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
    );

    const totalPayout = dataToPrint.reduce((sum, item) => sum + item.dailyProfit, 0);

    const tableRows = dataToPrint.map((item, i) => `
      <tr>
        <td class="col-no">${i + 1}</td>
        <td class="col-umkm">${item.name}</td>
        <td class="col-pemilik">${item.ownerName || '-'}</td>
        <td class="col-bank">${item.bankName || '-'}</td>
        <td class="col-rek">${item.accountNumber || '-'}</td>
        <td class="col-total">
          <div style="display: flex; justify-content: space-between;">
            <span>Rp</span>
            <span>${new Intl.NumberFormat('id-ID').format(item.dailyProfit)}</span>
          </div>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Daftar Penyetoran - ${rangeText}</title>
          <style>
            @page { size: portrait; margin: 0; }
            body { 
              font-family: sans-serif; 
              color: #333; 
              line-height: 1.4; 
              padding: 20mm;
            }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .meta { margin-top: 10px; font-weight: bold; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background: #f5f5f5; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #ddd; white-space: nowrap; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .col-no { text-align: center; width: 40px; }
            .col-umkm { font-weight: bold; white-space: nowrap; }
            .col-pemilik { word-break: break-word; }
            .col-bank { font-weight: bold; white-space: nowrap; }
            .col-rek { font-family: monospace; white-space: nowrap; }
            .col-total { font-weight: bold; white-space: nowrap; width: 120px; }
            .total { margin-top: 30px; border-top: 2px solid #333; padding-top: 15px; }
            .total-container { display: flex; justify-content: flex-end; font-size: 16px; font-weight: bold; align-items: center; }
            .total-label { margin-right: 20px; text-transform: uppercase; }
            .total-value { width: 150px; display: flex; justify-content: space-between; font-size: 18px; }
            .footer-sig { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px; margin-top: 80px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${role === "SUPPLIER" ? "Laporan Saldo Mitra Jjs" : "Laporan Penyetoran Mitra Jjs"}</h1>
            <div class="meta">Periode: ${rangeText}</div>
            ${bankFilter !== "ALL" ? `<div class="meta" style="margin-top: 5px;">Filter: ${bankFilter}</div>` : ""}
          </div>
          <table>
            <thead>
              <tr>
                <th class="col-no">No</th>
                <th>Nama UMKM</th>
                <th>Pemilik</th>
                <th>Bank</th>
                <th>No Rekening</th>
                <th style="text-align:right">Total Setor</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="total">
            <div class="total-container">
              <div class="total-label">Total Seluruhnya</div>
              <div class="total-value">
                <span>Rp</span>
                <span>${new Intl.NumberFormat('id-ID').format(totalPayout)}</span>
              </div>
            </div>
          </div>
          <div class="footer-sig">
            <div class="sig">Penyetor</div>
            <div class="sig">Admin</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10 px-0 md:px-0">
      <Dialog open={isConfirmAllOpen} onOpenChange={(open) => !isValidatingAll && setIsConfirmAllOpen(open)}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-400">
              <AlertCircle className="w-5 h-5" /> Konfirmasi Validasi Massal
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Anda yakin ingin memvalidasi <span className="font-bold text-white">{unvalidatedIds.length} UMKM</span> sekaligus? Tindakan ini akan menambahkan saldo ke masing-masing UMKM dan mengubah status menjadi tervalidasi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-end border-t border-white/10 pt-4 bg-transparent">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmAllOpen(false)}
              disabled={isValidatingAll}
              className="bg-transparent border-white/20 text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={executeValidateAll}
              disabled={isValidatingAll}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 min-w-[120px]"
            >
              {isValidatingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Ya, Validasi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PayoutHistoryModal
        isOpen={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        supplierId={selectedSupplier?.id}
        supplierName={selectedSupplier?.name}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            Info <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">{role === "SUPPLIER" ? "Saldo" : "Penyetoran"}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl">
            {role === "SUPPLIER" ? "Rekapitulasi saldo pendapatan Anda yang sudah dicairkan." : "Rekapitulasi transaksi harian yang siap disetorkan ke Mitra Jjs. Gunakan filter untuk melihat data spesifik."}
          </p>
        </div>

        {role === "SUPPLIER" && (
          <div className="animate-in slide-in-from-top-4 duration-700">
            <Card className="bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border-white/10 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] overflow-hidden relative group shadow-2xl shadow-emerald-950/20">
              <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Wallet className="w-32 h-32 md:w-40 md:h-40 text-emerald-400" />
              </div>
              <CardContent className="p-6 md:p-10 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                  <div className="space-y-4 md:space-y-6 text-center md:text-left">
                    <div>
                      <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] text-emerald-400/80 mb-2 md:mb-3">Total Saldo Pendapatan</p>
                      <h3 className="text-3xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(data.reduce((sum, item) => sum + item.dailyProfit, 0))}
                      </h3>
                    </div>

                    {/* Info Rekening */}
                    <div className="flex flex-col gap-1 border-l-0 md:border-l-2 border-emerald-500/30 pl-0 md:pl-4 py-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Rekening Tujuan Pencairan</p>
                      <p className="text-sm md:text-base font-black text-white tracking-wide uppercase">
                        {(data[0] as any)?.supplier?.ownerName || (data[0] as any)?.supplier?.name || "-"}
                      </p>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.15em] font-mono">
                        {(data[0] as any)?.supplier?.bankName || "-"} • {(data[0] as any)?.supplier?.accountNumber || "-"}
                      </p>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-3 text-emerald-400/90 text-[10px] font-black uppercase bg-emerald-500/10 w-fit mx-auto md:mx-0 px-4 py-2 rounded-xl border border-emerald-500/20 backdrop-blur-md tracking-wider">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Saldo tervalidasi yang sudah ditransfer</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-1 md:gap-2 text-center md:text-right border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Riwayat Transaksi</p>
                    <p className="text-2xl font-black text-white tracking-tight">{data.length} <span className="text-sm text-slate-500 font-bold uppercase tracking-widest">Nota</span></p>
                    <div className="mt-1 md:mt-2 text-[10px] font-bold text-slate-400 flex items-center justify-center md:justify-end gap-1">
                      <Clock className="w-3 h-3" /> Berdasarkan filter tanggal
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col gap-4 bg-slate-900/50 p-3 rounded-2xl md:rounded-[2rem] border border-white/5 backdrop-blur-md lg:grid lg:grid-cols-12 lg:items-center">
          {/* Date Filter */}
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 bg-slate-950/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group cursor-pointer h-14",
            role === "SUPPLIER" ? "lg:col-span-12" : "lg:col-span-3"
          )}>
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rentang Tanggal</span>
              <Popover>
                <PopoverTrigger className="flex items-center gap-2 text-sm font-bold text-white focus:outline-none p-0 h-auto bg-transparent border-none w-full text-left">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <span className="truncate">
                        {format(dateRange.from, "dd MMM", { locale: localeId })} - {format(dateRange.to, "dd MMM yyyy", { locale: localeId })}
                      </span>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: localeId })
                    )
                  ) : (
                    <span>Pilih Tanggal</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] md:w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {role !== "SUPPLIER" && (
            <>
              {/* Bank Filter */}
              <div className="lg:col-span-2 flex items-center gap-3 px-4 py-2 bg-slate-950/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group h-14">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <Filter className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Metode</span>
                  <Select value={bankFilter} onValueChange={(val) => val && setBankFilter(val)}>
                    <SelectTrigger className="h-auto p-0 bg-transparent border-none text-sm font-bold text-white focus:ring-0 w-full hover:bg-transparent data-placeholder:text-slate-500">
                      <SelectValue placeholder="Pilih Filter" />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false} className="bg-slate-900/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl p-1.5 shadow-2xl z-[100] min-w-[200px]">
                      <SelectItem value="ALL" className="rounded-xl py-2.5 focus:bg-white/10 focus:text-white transition-colors">Semua Pembayaran</SelectItem>
                      <SelectItem value="CASH" className="rounded-xl py-2.5 focus:bg-white/10 focus:text-white transition-colors">Cash / Tunai</SelectItem>
                      <SelectItem value="BANK" className="rounded-xl py-2.5 focus:bg-white/10 focus:text-white transition-colors">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search */}
              <div className="lg:col-span-3 relative group h-14">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input
                  placeholder="Cari UMKM..."
                  className="w-full h-full pl-12 pr-4 bg-slate-950/40 border-white/5 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold text-white placeholder:text-slate-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="lg:col-span-4 flex items-center gap-2">
                <Button
                  onClick={handleValidateAllClick}
                  disabled={filteredAndSortedData.filter(i => !i.isValidated).length === 0}
                  className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider shadow-lg shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50 gap-2 text-xs md:text-sm"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" /> <span className="truncate">Validasi Semua</span>
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={filteredAndSortedData.length === 0}
                  className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 gap-2 text-xs md:text-sm"
                >
                  <Printer className="w-5 h-5 shrink-0" /> <span className="truncate">Cetak</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
             <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
             <p className="text-slate-500 font-medium">Memuat data...</p>
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
            <p className="text-slate-500 font-medium italic">Tidak ada transaksi pada tanggal ini.</p>
          </div>
        ) : (
          filteredAndSortedData.map((item) => (
            <Card key={item.id} className="bg-slate-900/40 border-white/5 rounded-2xl overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {role === "SUPPLIER" ? "Keterangan" : "Nama UMKM"}
                    </span>
                    <h4 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors uppercase truncate max-w-[200px]">
                      {item.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                      {role === "SUPPLIER" ? "Pendapatan" : "Total Setor"}
                    </span>
                    <span className="text-lg font-black text-emerald-400">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.dailyProfit)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {role === "SUPPLIER" ? "Tanggal" : "Pemilik"}
                    </span>
                    <p className="text-sm font-bold text-slate-300">
                      {item.ownerName || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {role === "SUPPLIER" ? "Waktu" : "Metode"}
                    </span>
                    <p className="text-sm font-bold text-slate-300">
                      {role === "SUPPLIER" ? "TERVALIDASI" : (item.bankName || "CASH")}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {role === "SUPPLIER" ? "Nomor Nota" : "No Rekening"}
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-400">
                      {item.accountNumber || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-white/5 flex gap-2">
                  {role === "SUPPLIER" ? (
                    <Button
                      onClick={() => {
                        const supplier = (item as any).supplier || (filteredAndSortedData[0] as any).supplier;
                        setSelectedSupplier({ 
                          id: supplier?.id || "", 
                          name: supplier?.name || "" 
                        });
                        setIsHistoryModalOpen(true);
                      }}
                      className="w-full h-11 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-white font-bold border border-white/10 gap-2 transition-all"
                    >
                      <Eye className="w-4 h-4" /> Lihat Detail
                    </Button>
                  ) : (
                    <>
                       {!item.isValidated ? (
                         <Button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/reports/validate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  supplierId: item.id,
                                  startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
                                  endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
                                }),
                              });
                              if (res.ok) window.location.reload();
                              else alert("Gagal memvalidasi.");
                            } catch (e) { alert("Kesalahan sistem."); }
                          }}
                          className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Validasi
                        </Button>
                       ) : (
                        <div className="flex-1 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-4 h-4" /> Tervalidasi
                        </div>
                       )}
                       <Button
                        variant="ghost"
                        onClick={() => {
                          const s = (item as any).supplier || item;
                          setSelectedSupplier({ id: s.id, name: s.name });
                          setIsHistoryModalOpen(true);
                        }}
                        className="h-11 w-11 p-0 rounded-xl bg-white/5 border border-white/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="hidden md:block border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-6 px-8 cursor-pointer group" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Keterangan / Nota" : "Nama UMKM"} {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("ownerName")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Tanggal" : "Pemilik"} {getSortIcon("ownerName")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("bankName")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Waktu" : "Bank"} {getSortIcon("bankName")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("accountNumber")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Nomor Nota" : "No Rekening"} {getSortIcon("accountNumber")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 px-8 text-right cursor-pointer group" onClick={() => handleSort("dailyProfit")}>
                    <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Pendapatan" : "Total Setor"} {getSortIcon("dailyProfit")}
                    </div>
                  </TableHead>
                  {role === "SUPPLIER" ? (
                    <TableHead className="py-6 px-8 text-center">
                      <div className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Aksi
                      </div>
                    </TableHead>
                  ) : (
                    <TableHead className="py-6 px-8 text-center">
                      <div className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Validasi
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24">
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">Memuat data transaksi...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24 text-slate-500 font-medium italic">
                      Tidak ada transaksi pada tanggal ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedData.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.03] transition-all duration-500 group relative">
                      <TableCell className="py-6 px-8 relative overflow-hidden">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-emerald-500 group-hover:h-1/2 transition-all duration-500 rounded-r-full" />
                        <span className="font-black text-lg text-white tracking-tight group-hover:text-emerald-400 transition-all duration-300 uppercase">
                          {item.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                          {item.ownerName || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-8">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            role === "SUPPLIER" ? "bg-emerald-400" : "bg-blue-400"
                          )} />
                          <span className="font-black text-slate-300 tracking-wider uppercase group-hover:text-white transition-colors">
                            {role === "SUPPLIER" ? "TERVALIDASI" : (item.bankName || "CASH")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                          {item.accountNumber || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <span className="font-black text-xl tracking-tighter text-emerald-400 transition-all duration-500 group-hover:scale-110 inline-block origin-right group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 2
                          }).format(item.dailyProfit)}
                        </span>
                      </TableCell>
                      {role === "SUPPLIER" ? (
                        <TableCell className="text-center px-8">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const supplier = (item as any).supplier || (filteredAndSortedData[0] as any).supplier;
                              setSelectedSupplier({ 
                                id: supplier?.id || "", 
                                name: supplier?.name || "" 
                              });
                              setIsHistoryModalOpen(true);
                            }}
                            className="h-9 w-9 p-0 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 transition-all border border-white/5"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      ) : (
                        <TableCell className="text-center px-8">
                          {item.isValidated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                              Tervalidasi
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/reports/validate", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      supplierId: item.id,
                                      startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
                                      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
                                    }),
                                  });
                                  if (res.ok) {
                                    window.location.reload();
                                  } else {
                                    alert("Gagal memvalidasi setoran.");
                                  }
                                } catch (e) {
                                  alert("Terjadi kesalahan.");
                                }
                              }}
                              className="h-8 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-bold text-xs"
                            >
                              Validasi
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
