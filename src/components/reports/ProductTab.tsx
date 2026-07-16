import { useState, useEffect } from "react";
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface ProductTabProps {
  groupedProductsByNote: any[];
  produkSearch: string;
  setProdukSearch: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onSelectProductNote: (g: any) => void;
}

export function ProductTab({
  groupedProductsByNote,
  produkSearch,
  setProdukSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSelectProductNote
}: ProductTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [produkSearch, startDate, endDate]);

  const totalPages = Math.ceil(groupedProductsByNote.length / itemsPerPage);
  const paginatedProducts = groupedProductsByNote.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" /> Arsip Produk
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-1">Akumulasi stok dan penjualan produk berdasarkan riwayat transaksi.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            className="h-14 bg-card/40 border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all duration-300"
          />

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <Input placeholder="Cari produk..." className="pl-11 pr-4 h-14 w-64 bg-card/40 border border-white/5 rounded-2xl focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 text-white placeholder-slate-500" value={produkSearch} onChange={(e) => setProdukSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-white/2">
            <TableRow className="border-white/5">
              <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Tanggal</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No Nota</TableHead>
              <TableHead className="py-5 text-center font-black text-[10px] uppercase tracking-widest text-slate-500">Total Beli</TableHead>
              <TableHead className="py-5 text-center font-black text-[10px] uppercase tracking-widest text-slate-500">Total Jual</TableHead>
              <TableHead className="py-5 text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Persentase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-500 italic">Tidak ada data produk dalam periode ini.</TableCell></TableRow>
            ) : (
              paginatedProducts.map((g: any, idx: number) => {
                const sellRate = g.totalBeli > 0 ? ((g.totalJual / g.totalBeli) * 100).toFixed(1) : "0";
                return (
                  <TableRow 
                    key={idx} 
                    className="border-white/5 hover:bg-white/2 cursor-pointer group transition-all"
                    onClick={() => onSelectProductNote(g)}
                  >
                    <TableCell className="py-5 px-8 font-bold text-white whitespace-nowrap">{format(new Date(g.date), "dd MMM yyyy", { locale: id })}</TableCell>
                    <TableCell className="font-black text-blue-400 group-hover:text-emerald-400 transition-colors">{g.noteNumber || "-"}</TableCell>
                    <TableCell className="text-center font-bold text-slate-400">{g.totalBeli}</TableCell>
                    <TableCell className="text-center font-black text-emerald-400">{g.totalJual}</TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-white">{sellRate}%</span>
                        <div className="w-16 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Number(sellRate))}%` }} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/1">
            <p className="text-xs text-slate-400 font-medium">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
