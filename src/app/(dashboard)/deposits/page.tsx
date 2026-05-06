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
import { Search, Wallet, ArrowUpDown, History, Calendar as CalendarIcon, Printer, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { PayoutHistoryModal } from "@/components/payout-history-modal";

interface DepositItem {
  id: string;
  name: string;
  ownerName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  dailyProfit: number;
}

export default function DepositsPage() {
  const [data, setData] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sortConfig, setSortConfig] = useState<{ key: keyof DepositItem; direction: "asc" | "desc" } | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string, name: string } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Fetch role from lightweight API
    fetch('/api/auth/role')
      .then(res => res.json())
      .then(data => setRole(data.role))
      .catch(err => console.error("Failed to fetch role:", err));

    setLoading(true);
    fetch(`/api/reports?date=${selectedDate}&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        const reports = Array.isArray(data) ? data : (data.reports || []);
        if (Array.isArray(reports)) {
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
                dailyProfit: 0
              };
            }
            grouped[s.id].dailyProfit += r.profit80;
          });
          
          setData(Object.values(grouped));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch reports:", err);
        setLoading(false);
      });
  }, [selectedDate]);

  const handleSort = (key: keyof DepositItem) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data].filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = (a[sortConfig.key] as any) || "";
        const valB = (b[sortConfig.key] as any) || "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const formattedDate = format(new Date(selectedDate), "dd MMMM yyyy", { locale: localeId });
    
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
          <title>Daftar Penyetoran - ${selectedDate}</title>
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
            <h1>Laporan Penyetoran Mitra Jjs</h1>
            <div class="meta">Tanggal Transaksi: ${formattedDate}</div>
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

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Data <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-blue-400">Penyetoran</span>
          </h2>
          <p className="text-slate-400 font-medium">Rekapitulasi transaksi harian yang siap disetorkan ke Mitra Jjs.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5 no-print">
            <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal Transaksi</span>
                <Popover>
                  <PopoverTrigger className="flex items-center gap-2 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto bg-transparent border-none">
                    <CalendarIcon className="w-4 h-4 text-emerald-400" />
                    {format(new Date(selectedDate), "dd MMM yyyy", { locale: localeId })}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="end">
                    <Calendar
                      mode="single"
                      selected={new Date(selectedDate)}
                      onSelect={(date) => date && setSelectedDate(format(date, "yyyy-MM-dd"))}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <Input 
              placeholder="Cari UMKM..." 
              className="pl-11 pr-4 h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button 
            onClick={handlePrint}
            disabled={filteredAndSortedData.length === 0}
            className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-5 h-5 mr-2" /> Cetak Setoran
          </Button>
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
                      Nama UMKM <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("ownerName")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Pemilik <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("bankName")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Bank <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("accountNumber")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      No Rekening <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 px-8 text-right cursor-pointer group" onClick={() => handleSort("dailyProfit")}>
                    <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Total Setor <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </TableHead>
                  {role === "SUPPLIER" && (
                    <TableHead className="py-6 px-8 text-center">
                      <div className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Aksi
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
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-all duration-300 group">
                      <TableCell className="py-6 px-8">
                        <span className="font-black text-lg text-white tracking-tight group-hover:text-emerald-400 transition-colors uppercase">
                          {item.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                          {item.ownerName || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-slate-300 tracking-wider uppercase group-hover:text-white transition-colors">
                          {item.bankName || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                          {item.accountNumber || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <span className="font-black text-xl tracking-tighter text-emerald-400 transition-all duration-300 group-hover:scale-105 inline-block origin-right">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 2
                          }).format(item.dailyProfit)}
                        </span>
                      </TableCell>
                      {role === "SUPPLIER" && (
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
