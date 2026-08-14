import { useState, useEffect, useMemo } from "react";
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
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

  const pageTotals = useMemo(() => {
    const sumBeli = paginatedProducts.reduce((acc, g) => acc + (Number(g.totalBeli) || 0), 0);
    const sumJual = paginatedProducts.reduce((acc, g) => acc + (Number(g.totalJual) || 0), 0);
    const overallRate = sumBeli > 0 ? ((sumJual / sumBeli) * 100).toFixed(1) : "0";
    return { sumBeli, sumJual, overallRate };
  }, [paginatedProducts]);

  return (
    <Card className="border border-white/10 bg-card rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            Arsip Produk
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs font-medium mt-1">Akumulasi stok dan penjualan produk berdasarkan riwayat transaksi.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            className="h-12 w-full sm:w-auto bg-card/40 border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all duration-300"
          />

          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <Input placeholder="Cari nama produk..." className="pl-11 pr-4 h-12 w-full bg-card/40 border border-white/5 rounded-2xl focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 text-white placeholder-slate-500" value={produkSearch} onChange={(e) => setProdukSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-zinc-900/80 backdrop-blur-md">
            <TableRow className="border-b border-white/10">
              <TableHead className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">No Nota</TableHead>
              <TableHead className="py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Total Beli</TableHead>
              <TableHead className="py-4 text-center text-xs font-bold uppercase tracking-wider text-emerald-400">Total Jual</TableHead>
              <TableHead className="py-4 text-right px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Persentase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-slate-400 italic font-medium">Tidak ada data produk dalam periode ini.</TableCell></TableRow>
            ) : (
              paginatedProducts.map((g: any, idx: number) => {
                const sellRate = g.totalBeli > 0 ? ((g.totalJual / g.totalBeli) * 100).toFixed(1) : "0";
                return (
                  <TableRow 
                    key={idx} 
                    className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer group transition-colors duration-150"
                    onClick={() => onSelectProductNote(g)}
                  >
                    <TableCell className="py-4 px-6 font-semibold text-white text-sm whitespace-nowrap">{format(new Date(g.date), "dd MMM yyyy", { locale: id })}</TableCell>
                    <TableCell className="py-4">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg inline-block group-hover:bg-emerald-500/20 transition-colors">
                        {g.noteNumber || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center font-bold text-slate-300 text-sm tabular-nums">{g.totalBeli}</TableCell>
                    <TableCell className="py-4 text-center font-black text-emerald-400 text-sm tabular-nums">{g.totalJual}</TableCell>
                    <TableCell className="py-4 text-right px-6">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-white text-xs tabular-nums bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">{sellRate}%</span>
                        <div className="w-16 h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Number(sellRate))}%` }} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {paginatedProducts.length > 0 && (
            <TableFooter className="bg-emerald-950/20 border-t-2 border-emerald-500/30">
              <TableRow>
                <TableCell colSpan={2} className="py-4 px-6 font-bold text-white text-xs uppercase tracking-wider">
                  TOTAL HALAMAN INI ({paginatedProducts.length} Nota)
                </TableCell>
                <TableCell className="py-4 text-center font-bold text-slate-100 text-sm tabular-nums">
                  {pageTotals.sumBeli}
                </TableCell>
                <TableCell className="py-4 text-center font-black text-emerald-400 text-sm tabular-nums">
                  {pageTotals.sumJual}
                </TableCell>
                <TableCell className="py-4 text-right px-6">
                  <span className="font-black text-white text-sm tabular-nums bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-emerald-300">
                    {pageTotals.overallRate}%
                  </span>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-slate-400 font-medium">
              Halaman <span className="text-white font-bold">{currentPage}</span> dari <span className="text-white font-bold">{totalPages}</span> ({groupedProductsByNote.length} nota)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer"
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

