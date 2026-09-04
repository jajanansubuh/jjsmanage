import { useState, useEffect, useMemo } from "react";
import { Coins, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
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
}: SavingsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{
    key: "date" | "noteNumber" | "totalRevenue" | "totalTabungan";
    direction: "asc" | "desc";
  }>({
    key: "date",
    direction: "desc",
  });

  const handleSort = (key: "date" | "noteNumber" | "totalRevenue" | "totalTabungan") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [savingsSearch, startDate, endDate, sortConfig]);

  const sortedSavings = useMemo(() => {
    return [...groupedSavingsByNote].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "date") {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === "string") {
        return sortConfig.direction === "asc"
          ? (valA || "").localeCompare(valB || "")
          : (valB || "").localeCompare(valA || "");
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortConfig.direction === "asc" ? valA - valB : valB - valA;
    });
  }, [groupedSavingsByNote, sortConfig]);

  const totalPages = Math.ceil(sortedSavings.length / itemsPerPage);
  const paginatedSavings = sortedSavings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pageTotals = useMemo(() => {
    return paginatedSavings.reduce(
      (acc, s) => ({
        totalRevenue: acc.totalRevenue + (Number(s.totalRevenue) || 0),
        totalTabungan: acc.totalTabungan + (Number(s.totalTabungan) || 0),
      }),
      { totalRevenue: 0, totalTabungan: 0 }
    );
  }, [paginatedSavings]);

  const getSortIcon = (key: "date" | "noteNumber" | "totalRevenue" | "totalTabungan") => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
    );
  };

  return (
    <Card className="border border-white/10 bg-card rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Coins className="w-5 h-5" />
            </div>
            Riwayat Tabungan
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs font-medium mt-1">Potongan tabungan otomatis dari setiap transaksi (Dikelompokkan per Nota).</CardDescription>
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
            <Input placeholder="Cari nota atau supplier..." className="pl-11 pr-4 h-12 w-full bg-card/40 border border-white/5 rounded-2xl focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 text-white placeholder-slate-500" value={savingsSearch} onChange={(e) => setSavingsSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-zinc-900/80 backdrop-blur-md">
            <TableRow className="border-b border-white/10">
              <TableHead 
                className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Tanggal</span>
                  {getSortIcon("date")}
                </div>
              </TableHead>
              <TableHead 
                className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort("noteNumber")}
              >
                <div className="flex items-center gap-1.5">
                  <span>No Nota</span>
                  {getSortIcon("noteNumber")}
                </div>
              </TableHead>
              <TableHead 
                className="py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort("totalRevenue")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Omzet</span>
                  {getSortIcon("totalRevenue")}
                </div>
              </TableHead>
              <TableHead 
                className="py-4 text-right px-6 text-xs font-bold uppercase tracking-wider text-blue-400 cursor-pointer select-none group hover:text-blue-300 transition-colors"
                onClick={() => handleSort("totalTabungan")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Tabungan</span>
                  {getSortIcon("totalTabungan")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSavings.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-16 text-slate-400 italic font-medium">Belum ada riwayat tabungan.</TableCell></TableRow>
            ) : (
              paginatedSavings.map((s) => (
                <TableRow 
                  key={s.id} 
                  className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer group transition-colors duration-150"
                  onClick={() => onSelectSavings(s)}
                >
                  <TableCell className="py-4 px-6 font-semibold text-white text-sm whitespace-nowrap">{format(new Date(s.date), "dd MMM yyyy", { locale: id })}</TableCell>
                  <TableCell className="py-4">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg inline-block group-hover:bg-blue-500/20 transition-colors">
                      {s.noteNumber}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium text-slate-200 text-sm tabular-nums">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.totalRevenue)}</TableCell>
                  <TableCell className="py-4 text-right px-6 font-black text-blue-400 text-base tabular-nums">+ {new Intl.NumberFormat("id-ID").format(s.totalTabungan)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {paginatedSavings.length > 0 && (
            <TableFooter className="bg-blue-950/20 border-t-2 border-blue-500/30">
              <TableRow>
                <TableCell colSpan={2} className="py-4 px-6 font-bold text-white text-xs uppercase tracking-wider">
                  TOTAL HALAMAN INI ({paginatedSavings.length} Nota)
                </TableCell>
                <TableCell className="py-4 text-right font-bold text-slate-100 text-sm tabular-nums">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(pageTotals.totalRevenue)}
                </TableCell>
                <TableCell className="py-4 text-right px-6 font-black text-blue-400 text-base tabular-nums">
                  + {new Intl.NumberFormat("id-ID").format(pageTotals.totalTabungan)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-slate-400 font-medium">
              Halaman <span className="text-white font-bold">{currentPage}</span> dari <span className="text-white font-bold">{totalPages}</span> ({sortedSavings.length} nota)
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

