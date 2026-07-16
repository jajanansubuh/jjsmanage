import { useState, useEffect, useMemo } from "react";
import { Wallet, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Users } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

    // Set mitraCount after all deposits are grouped
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
    <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-400" /> Riwayat Setoran (Tervalidasi)
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-1">Daftar setoran / pendapatan mitra yang sudah divalidasi, dikelompokkan per tanggal.</CardDescription>
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
            <Input placeholder="Cari mitra..." className="pl-11 pr-4 h-14 w-64 bg-card/40 border border-white/5 rounded-2xl focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 text-white placeholder-slate-500" value={payoutSearch} onChange={(e) => setPayoutSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-white/2">
            <TableRow className="border-white/5">
              <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500 w-12"></TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Tanggal</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Jumlah Mitra</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Total Setoran</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Metode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGroups.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-500 italic">Belum ada riwayat setoran.</TableCell></TableRow>
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
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/1">
            <p className="text-xs text-slate-400 font-medium">
              Halaman {currentPage} dari {totalPages} ({groupedByDate.length} tanggal, {validatedDeposits.length} setoran)
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

function DepositDateGroup({ group, isExpanded, onToggle }: { group: GroupedDate; isExpanded: boolean; onToggle: () => void }) {
  return (
    <>
      {/* Parent row — grouped by date */}
      <TableRow
        className="border-white/5 hover:bg-white/3 transition-colors cursor-pointer select-none"
        onClick={onToggle}
      >
        <TableCell className="py-5 px-8 w-12">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 transition-transform duration-200">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </TableCell>
        <TableCell className="py-5 font-bold text-white whitespace-nowrap text-sm">
          {format(group.date, "dd MMM yyyy", { locale: id })}
        </TableCell>
        <TableCell className="py-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            {group.mitraCount} mitra
          </span>
        </TableCell>
        <TableCell className="py-5 font-black text-white text-sm">
          {currencyFormat.format(group.totalAmount)}
        </TableCell>
        <TableCell className="py-5">
          <div className="flex flex-wrap gap-1.5">
            {group.methods.map((m) => (
              <span key={m} className="text-slate-500 font-bold uppercase text-[10px] tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                {m}
              </span>
            ))}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded child rows — individual deposits */}
      {isExpanded && group.deposits
        .sort((a, b) => b.amount - a.amount)
        .map((d, idx) => (
        <TableRow key={d.id || idx} className="border-white/5 bg-white/1.5 hover:bg-white/3 transition-colors">
          <TableCell className="py-3 px-8">
            <div className="w-7 h-7 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
            </div>
          </TableCell>
          <TableCell className="py-3 text-slate-500 text-xs font-medium">
            └
          </TableCell>
          <TableCell className="py-3 font-black text-indigo-400 uppercase text-sm">
            {d.supplierName}
          </TableCell>
          <TableCell className="py-3 font-bold text-slate-300 text-sm">
            {currencyFormat.format(d.amount)}
          </TableCell>
          <TableCell className="py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
            {d.paymentMethod}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
