import { useState, useEffect, useMemo } from "react";
import { Wallet, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Users } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface DepositTabProps {
  validatedDeposits: any[];
  payoutSearch: string;
  setPayoutSearch: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
}

interface GroupedDate {
  dateKey: string;
  date: Date;
  deposits: any[];
  totalAmount: number;
  mitraCount: number;
  methods: string[];
}

const currencyFormat = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function DepositTab({
  validatedDeposits,
  payoutSearch,
  setPayoutSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: DepositTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
    setExpandedDates(new Set());
  }, [payoutSearch, startDate, endDate]);

  // Group deposits by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, GroupedDate> = {};

    validatedDeposits.forEach((d) => {
      const dateObj = new Date(d.date);
      const dateKey = format(dateObj, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          date: dateObj,
          deposits: [],
          totalAmount: 0,
          mitraCount: 0,
          methods: [],
        };
      }

      groups[dateKey].deposits.push(d);
      groups[dateKey].totalAmount += d.amount;

      const method = (d.paymentMethod || "CASH").toUpperCase();
      if (!groups[dateKey].methods.includes(method)) {
        groups[dateKey].methods.push(method);
      }
    });

    Object.values(groups).forEach((g) => {
      g.mitraCount = g.deposits.length;
    });

    return Object.values(groups).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }, [validatedDeposits]);

  const totalPages = Math.ceil(groupedByDate.length / itemsPerPage);
  const paginatedGroups = groupedByDate.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pageTotals = useMemo(() => {
    return paginatedGroups.reduce(
      (acc, g) => ({
        totalSetoran: acc.totalSetoran + g.totalAmount,
        totalMitraCount: acc.totalMitraCount + g.mitraCount,
      }),
      { totalSetoran: 0, totalMitraCount: 0 }
    );
  }, [paginatedGroups]);

  const toggleExpand = (dateKey: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  return (
    <Card className="border border-white/10 bg-card rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Wallet className="w-5 h-5" />
            </div>
            Riwayat Setoran (Tervalidasi)
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs font-medium mt-1">Daftar setoran / pendapatan supplier yang sudah divalidasi, dikelompokkan per tanggal.</CardDescription>
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
            <Input placeholder="Cari supplier..." className="pl-11 pr-4 h-12 w-full bg-card/40 border border-white/5 rounded-2xl focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 text-white placeholder-slate-500" value={payoutSearch} onChange={(e) => setPayoutSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-zinc-900/80 backdrop-blur-md">
            <TableRow className="border-b border-white/10">
              <TableHead className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 w-12"></TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Jumlah Supplier</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-emerald-400">Total Setoran</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Metode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGroups.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-slate-400 italic font-medium">Belum ada riwayat setoran.</TableCell></TableRow>
            ) : (
              paginatedGroups.map((group) => {
                const isExpanded = expandedDates.has(group.dateKey);
                return (
                  <DepositDateGroup
                    key={group.dateKey}
                    group={group}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpand(group.dateKey)}
                  />
                );
              })
            )}
          </TableBody>
          {paginatedGroups.length > 0 && (
            <TableFooter className="bg-emerald-950/20 border-t-2 border-emerald-500/30">
              <TableRow>
                <TableCell colSpan={2} className="py-4 px-6 font-bold text-white text-xs uppercase tracking-wider">
                  TOTAL HALAMAN INI ({paginatedGroups.length} Tanggal)
                </TableCell>
                <TableCell className="py-4 font-bold text-indigo-300 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <Users className="w-3.5 h-3.5" /> {pageTotals.totalMitraCount} Supplier
                  </span>
                </TableCell>
                <TableCell className="py-4 font-black text-emerald-400 text-sm tabular-nums">
                  {currencyFormat.format(pageTotals.totalSetoran)}
                </TableCell>
                <TableCell className="py-4 px-6"></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-slate-400 font-medium">
              Halaman <span className="text-white font-bold">{currentPage}</span> dari <span className="text-white font-bold">{totalPages}</span> ({groupedByDate.length} tanggal, {validatedDeposits.length} setoran)
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

function DepositDateGroup({ group, isExpanded, onToggle }: { group: GroupedDate; isExpanded: boolean; onToggle: () => void }) {
  return (
    <>
      <TableRow
        className="border-b border-white/5 hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer select-none"
        onClick={onToggle}
      >
        <TableCell className="py-4 px-6 w-12">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 transition-transform duration-200">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </TableCell>
        <TableCell className="py-4 font-semibold text-white whitespace-nowrap text-sm">
          {format(group.date, "dd MMM yyyy", { locale: id })}
        </TableCell>
        <TableCell className="py-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            {group.mitraCount} supplier
          </span>
        </TableCell>
        <TableCell className="py-4 font-black text-emerald-400 text-sm tabular-nums">
          {currencyFormat.format(group.totalAmount)}
        </TableCell>
        <TableCell className="py-4">
          <div className="flex flex-wrap gap-1.5">
            {group.methods.map((m) => (
              <span key={m} className="text-slate-300 font-bold uppercase text-[10px] tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                {m}
              </span>
            ))}
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && group.deposits
        .sort((a, b) => b.amount - a.amount)
        .map((d, idx) => (
        <TableRow key={d.id || idx} className="border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
          <TableCell className="py-3 px-6">
            <div className="w-7 h-7 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            </div>
          </TableCell>
          <TableCell className="py-3 text-slate-500 text-xs font-medium">
            └
          </TableCell>
          <TableCell className="py-3 font-bold text-indigo-400 uppercase text-sm">
            {d.supplierName}
          </TableCell>
          <TableCell className="py-3 font-bold text-slate-200 text-sm tabular-nums">
            {currencyFormat.format(d.amount)}
          </TableCell>
          <TableCell className="py-3 text-slate-400 font-semibold uppercase text-xs tracking-wider">
            {d.paymentMethod}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

