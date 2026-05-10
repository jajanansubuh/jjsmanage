"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Wallet, ArrowUpDown, History, Calendar as CalendarIcon, Printer, Eye, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { PayoutHistoryModal } from "@/components/payout-history-modal";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    from: new Date(),
    to: new Date()
  });
  const [bankFilter, setBankFilter] = useState<string>("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof DepositItem; direction: "asc" | "desc" } | null>({ key: "dailyProfit", direction: "desc" });
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string, name: string } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

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
          // Group by supplier and sum profit80 (Mitra Jjs share)
          const grouped: Record<string, DepositItem> = {};
          
          reports.forEach((r: any) => {
            const s = r.supplier;
            if (!s) return;
            
            // Jika role SUPPLIER, skip laporan yang belum divalidasi
            if (userRole === "SUPPLIER" && !r.isValidated) {
              return;
            }
            
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
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10">
      <PayoutHistoryModal 
        isOpen={isHistoryModalOpen} 
        onOpenChange={setIsHistoryModalOpen} 
        supplierId={selectedSupplier?.id}
        supplierName={selectedSupplier?.name}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Data <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">{role === "SUPPLIER" ? "Saldo" : "Penyetoran"}</span>
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl">
            {role === "SUPPLIER" ? "Rekapitulasi saldo pendapatan Anda yang siap dicairkan." : "Rekapitulasi transaksi harian yang siap disetorkan ke Mitra Jjs. Gunakan filter untuk melihat data spesifik."}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-900/50 p-3 rounded-[2rem] border border-white/5 backdrop-blur-md">
          {/* Date Filter */}
          <div className="lg:col-span-3 flex items-center gap-3 px-4 py-2 bg-slate-950/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group cursor-pointer h-14">
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
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="start">
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
          <div className="lg:col-span-5 relative group h-14">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <Input 
              placeholder="Cari UMKM..." 
              className="w-full h-full pl-12 pr-4 bg-slate-950/40 border-white/5 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold text-white placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Print Button */}
          <div className="lg:col-span-2">
            <Button 
              onClick={handlePrint}
              disabled={filteredAndSortedData.length === 0}
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 gap-2"
            >
              <Printer className="w-5 h-5" /> Cetak
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-6 px-8 cursor-pointer group" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Nama UMKM {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("ownerName")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Pemilik {getSortIcon("ownerName")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("bankName")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Bank {getSortIcon("bankName")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("accountNumber")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      No Rekening {getSortIcon("accountNumber")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 px-8 text-right cursor-pointer group" onClick={() => handleSort("dailyProfit")}>
                    <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Total Saldo" : "Total Setor"} {getSortIcon("dailyProfit")}
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            (item.bankName?.toUpperCase() === "CASH" || item.bankName?.toUpperCase() === "TUNAI" || !item.bankName) 
                              ? "bg-amber-400" 
                              : "bg-blue-400"
                          )} />
                          <span className="font-black text-slate-300 tracking-wider uppercase group-hover:text-white transition-colors">
                            {item.bankName || "CASH"}
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
                              setSelectedSupplier({ id: item.id, name: item.name });
                              setIsHistoryModalOpen(true);
                            }}
                            className="h-9 w-9 p-0 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 transition-all border border-white/5"
                            title="Lihat Riwayat Transfer"
                          >
                            <History className="w-4 h-4" />
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
                                    // Refresh data
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
