import { useState, useEffect } from "react";
import { History, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface DeductionTabProps {
  filteredDeductions: any[];
  deductionSearch: string;
  setDeductionSearch: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onSelectDeduction: (d: any) => void;
}

export function DeductionTab({
  filteredDeductions,
  deductionSearch,
  setDeductionSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSelectDeduction
}: DeductionTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [deductionSearch, startDate, endDate]);

  const totalPages = Math.ceil(filteredDeductions.length / itemsPerPage);
  const paginatedDeductions = filteredDeductions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-rose-400" /> Riwayat Potongan
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-1">Arsip rincian biaya layanan dan iuran mitra.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            className="h-12 bg-slate-950/50 border-white/5 rounded-2xl"
          />

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            <Input placeholder="Cari suplier/nota..." className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-rose-500/20 text-white" value={deductionSearch} onChange={(e) => setDeductionSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-white/2">
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
            {paginatedDeductions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500 italic">Tidak ada riwayat potongan dalam periode ini.</TableCell></TableRow>
            ) : (
              paginatedDeductions.map((d) => {
                const totalDeduction = (d.serviceCharge || 0) + (d.kukuluban || 0) + (d.tabungan || 0);
                return (
                  <TableRow
                    key={d.id}
                    className="border-white/5 hover:bg-white/2 cursor-pointer"
                    onClick={() => onSelectDeduction(d)}
                  >
                    <TableCell className="py-5 px-8 font-bold text-white whitespace-nowrap">
                      {format(new Date(d.deductionDate || d.date || d.createdAt), "dd MMM yy")}
                    </TableCell>
                    <TableCell className="font-black text-blue-400">
                      {d.deductionNoteNumber || (d.deductionDate ? `POT-${format(new Date(d.deductionDate), "ddMMyy")}` : d.noteNumber || "-")}
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
