import { useState, useEffect } from "react";
import { Coins, Search, ChevronLeft, ChevronRight, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface SavingsTabProps {
  groupedSavingsByNote: any[];
  savingsSearch: string;
  setSavingsSearch: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onSelectSavings: (s: any) => void;
  onExport: () => void;
  onPrint: () => void;
}

export function SavingsTab({
  groupedSavingsByNote,
  savingsSearch,
  setSavingsSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSelectSavings,
  onExport,
  onPrint
}: SavingsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [savingsSearch, startDate, endDate]);

  const totalPages = Math.ceil(groupedSavingsByNote.length / itemsPerPage);
  const paginatedSavings = groupedSavingsByNote.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-400" /> Riwayat Tabungan
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-1">Potongan tabungan otomatis dari setiap transaksi (Dikelompokkan per Nota).</CardDescription>
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
            <Input placeholder="Cari nota atau suplier..." className="pl-11 pr-4 h-14 w-64 bg-card/40 border border-white/5 rounded-2xl focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 text-white placeholder-slate-500" value={savingsSearch} onChange={(e) => setSavingsSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-white/2">
            <TableRow className="border-white/5">
              <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Tanggal</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No Nota</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">Total Omzet</TableHead>
              <TableHead className="py-5 text-right px-8 font-black text-[10px] uppercase tracking-widest text-purple-400">Total Tabungan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSavings.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-500 italic">Belum ada riwayat tabungan.</TableCell></TableRow>
            ) : (
              paginatedSavings.map((s) => (
                <TableRow 
                  key={s.id} 
                  className="border-white/5 hover:bg-white/2 cursor-pointer group transition-all"
                  onClick={() => onSelectSavings(s)}
                >
                  <TableCell className="py-5 px-8 font-bold text-white whitespace-nowrap">{format(new Date(s.date), "dd MMM yyyy", { locale: id })}</TableCell>
                  <TableCell className="font-black text-purple-400 group-hover:text-purple-300 transition-colors">{s.noteNumber}</TableCell>
                  <TableCell className="text-right font-bold text-slate-400">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.totalRevenue)}</TableCell>
                  <TableCell className="text-right px-8 font-black text-purple-400 text-lg">+ {new Intl.NumberFormat("id-ID").format(s.totalTabungan)}</TableCell>
                </TableRow>
              ))
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
