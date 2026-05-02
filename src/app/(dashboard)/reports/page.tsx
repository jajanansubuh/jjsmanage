"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function ReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [reports, setReports] = useState<{ id: string, createdAt: string, supplier: { name: string }, revenue: number, profit80: number, profit20: number, barcode: number, cost: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    fetch("/api/reports")
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      });
  }, []);

  const filteredReports = reports.filter(r => {
    const matchName = r.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchDate = true;
    if (startDate || endDate) {
      const reportDate = new Date(r.createdAt as string);
      
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
    
    return matchName && matchDate;
  });

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      toast.error("Tidak ada data laporan untuk diexport");
      return;
    }

    const exportData = filteredReports.map((r, i) => ({
      No: i + 1,
      Tanggal: format(new Date(r.createdAt), "dd/MM/yyyy"),
      "Nama Suplier": r.supplier?.name || "-",
      Pendapatan: r.revenue,
      "Bagi Hasil 80%": r.profit80,
      "Bagi Hasil 20%": r.profit20,
      Barcode: r.barcode,
      Cost: r.cost
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Laporan");

    XLSX.writeFile(workbook, `Laporan_Konsinyasi_${format(new Date(), "yyyyMMdd")}.xlsx`);
    toast.success("Berhasil export ke Excel");
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Riwayat <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Laporan</span>
          </h2>
          <p className="text-slate-400 font-medium">Lihat dan kelola riwayat bagi hasil konsinyasi.</p>
        </div>
        <Button onClick={handleExportExcel} className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
          <Download className="w-5 h-5 mr-2 text-blue-400" /> Export Excel
        </Button>
      </div>

      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-8 px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-white">Daftar Seluruh Laporan</CardTitle>
              <CardDescription className="text-slate-400 font-medium mt-1">Total {filteredReports.length} laporan tersimpan dalam sistem.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 p-1 bg-slate-950/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors">Dari</span>
                    <Popover>
                      <PopoverTrigger 
                        className={cn(
                          "flex items-center justify-start text-left bg-transparent border-0 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto min-w-[90px]",
                          !startDate && "text-slate-500"
                        )}
                      >
                        {startDate ? format(new Date(startDate), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl rounded-2xl" align="end">
                        <Calendar
                          mode="single"
                          selected={startDate ? new Date(startDate) : undefined}
                          onSelect={(date) => date && setStartDate(format(date, "yyyy-MM-dd"))}
                          initialFocus
                          className="text-white p-3"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10 mx-1" />
                <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-400 transition-colors">Hingga</span>
                    <Popover>
                      <PopoverTrigger 
                        className={cn(
                          "flex items-center justify-start text-left bg-transparent border-0 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto min-w-[90px]",
                          !endDate && "text-slate-500"
                        )}
                      >
                        {endDate ? format(new Date(endDate), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl rounded-2xl" align="end">
                        <Calendar
                          mode="single"
                          selected={endDate ? new Date(endDate) : undefined}
                          onSelect={(date) => date && setEndDate(format(date, "yyyy-MM-dd"))}
                          initialFocus
                          className="text-white p-3"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  placeholder="Cari nama suplier..." 
                  className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-5 px-8">Tanggal</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Nama Suplier</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Pendapatan</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Bagi Hasil 80%</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Bagi Hasil 20%</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-right px-8">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><div className="flex flex-col items-center gap-3 text-slate-500"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span>Memuat data laporan...</span></div></TableCell></TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500 font-medium italic">Tidak ada laporan yang ditemukan.</TableCell></TableRow>
                ) : (
                  filteredReports.map((r) => (
                    <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <TableCell className="py-5 px-8">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-950 border border-white/5 text-slate-500 group-hover:text-blue-400 transition-colors">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {isMounted ? format(new Date(r.createdAt), "dd MMM yyyy", { locale: id }) : "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-300">{r.supplier?.name}</TableCell>
                      <TableCell className="font-bold text-white">{isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(r.revenue) : "Rp 0"}</TableCell>
                      <TableCell className="text-emerald-400 font-black">
                        {isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(r.profit80) : "Rp 0"}
                      </TableCell>
                      <TableCell className="text-blue-400 font-black">
                        {isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(r.profit20) : "Rp 0"}
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-blue-400/10 group/btn">
                          <FileText className="w-5 h-5 text-slate-500 group-hover/btn:text-blue-400 transition-colors" />
                        </Button>
                      </TableCell>
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
