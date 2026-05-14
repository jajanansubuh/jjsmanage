import { Fragment, useState } from "react";
import { 
  ArrowUpDown, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Scissors, 
  Barcode, 
  Wrench, 
  PiggyBank, 
  FileText 
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TransactionRecord } from "@/app/(dashboard)/payouts/hooks/use-payouts-data";
import { DeductionBadge } from "./DeductionBadge";

interface PayoutsTableProps {
  transactions: TransactionRecord[];
  loading: boolean;
  userRole: string | null;
  onSort: (key: string) => void;
  totalRevenue: number;
  totalProfit80: number;
}

export function PayoutsTable({
  transactions,
  loading,
  userRole,
  onSort,
  totalRevenue,
  totalProfit80
}: PayoutsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  const hasDeductions = (t: TransactionRecord) =>
    (t.barcode ?? 0) > 0 || 
    (t.serviceCharge ?? 0) > 0 || 
    (t.kukuluban ?? 0) > 0 || 
    (t.tabungan ?? 0) > 0;

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4 px-4">
        {loading ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
             <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
             <p className="text-slate-500 font-medium">Memuat riwayat...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
            <p className="text-slate-500 font-medium italic">Belum ada riwayat transaksi.</p>
          </div>
        ) : (
          transactions.map((t) => {
            const isExpanded = expandedRows.has(t.id);
            const canExpand = hasDeductions(t);
            return (
              <Card key={t.id} className={cn(
                "bg-slate-900/40 border-white/5 rounded-2xl overflow-hidden transition-all duration-300",
                isExpanded && "ring-1 ring-amber-500/30"
              )}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">No. Nota</span>
                      <p className="font-mono font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded text-sm w-fit">{t.noteNumber || "—"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Mitra Jjs</span>
                      <span className="text-lg font-black text-emerald-400">+{formatCurrency(t.profit80)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</span>
                      <p className="text-sm font-bold text-slate-300">{format(new Date(t.date), "dd MMM yyyy", { locale: id })}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Omzet</span>
                      <p className="text-sm font-bold text-slate-400">{formatCurrency(t.revenue)}</p>
                    </div>
                    {canExpand && (
                      <div className="col-span-2 flex justify-end">
                        <Button
                          variant="ghost" size="sm" onClick={() => toggleRow(t.id)}
                          className={cn("h-8 px-3 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest", isExpanded ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-slate-400")}
                        >
                          Detail {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </div>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-2">
                        <DeductionBadge icon={Barcode} label="Barcode" value={t.barcode} colorClass="bg-rose-500/10 border-rose-500/20 text-rose-400" />
                        <DeductionBadge icon={Wrench} label="S. Charge" value={t.serviceCharge || 0} colorClass="bg-orange-500/10 border-orange-500/20 text-orange-400" />
                        <DeductionBadge icon={Scissors} label="Kukuluban" value={t.kukuluban || 0} colorClass="bg-purple-500/10 border-purple-500/20 text-purple-400" />
                        <DeductionBadge icon={PiggyBank} label="Tabungan" value={t.tabungan || 0} colorClass="bg-sky-500/10 border-sky-500/20 text-sky-400" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10 mx-4 md:mx-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-6 pl-8 pr-2 w-10"><span className="sr-only">Detail</span></TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => onSort("date")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Tanggal <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => onSort("noteNumber")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      No. Nota <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </TableHead>
                  {userRole !== "SUPPLIER" && (
                    <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Catatan</TableHead>
                  )}
                  <TableHead className="py-6 px-4 text-right cursor-pointer group" onClick={() => onSort("revenue")}>
                    <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Omzet <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </TableHead>
                  <TableHead className="py-6 px-8 text-right cursor-pointer group" onClick={() => onSort("profit80")}>
                    <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      Mitra Jjs <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="text-center py-24 text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">Memuat riwayat transaksi...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="text-center py-24 text-slate-500 font-medium italic">
                      Belum ada riwayat transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <PayoutsTableRow 
                      key={t.id} t={t} userRole={userRole} 
                      isExpanded={expandedRows.has(t.id)} 
                      onToggle={() => toggleRow(t.id)} 
                      hasDeductions={hasDeductions(t)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && transactions.length > 0 && (
            <div className="border-t border-white/5 bg-white/[0.02] px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-bold text-slate-400">Menampilkan {transactions.length} transaksi</span>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Omzet</p>
                  <p className="text-base md:text-lg font-black text-white">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Mitra Jjs</p>
                  <p className="text-base md:text-lg font-black text-emerald-400">{formatCurrency(totalProfit80)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function PayoutsTableRow({ t, userRole, isExpanded, onToggle, hasDeductions }: { t: TransactionRecord; userRole: string | null; isExpanded: boolean; onToggle: () => void; hasDeductions: boolean }) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <Fragment>
      <TableRow 
        className={cn(
          "border-white/5 transition-all duration-300 group",
          hasDeductions ? "cursor-pointer hover:bg-white/[0.03]" : "hover:bg-white/[0.02]",
          isExpanded && "bg-white/[0.03]"
        )}
        onClick={() => hasDeductions && onToggle()}
      >
        <TableCell className="py-5 pl-8 pr-2">
          {hasDeductions ? (
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300", isExpanded ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500")}>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          ) : <div className="w-6 h-6" />}
        </TableCell>
        <TableCell className="py-5">
          <div className="flex flex-col">
            <span className="font-black text-white group-hover:text-amber-400 transition-colors">{format(new Date(t.date), "dd MMMM yyyy", { locale: id })}</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />{format(new Date(t.date), "HH:mm")} WIB</span>
          </div>
        </TableCell>
        <TableCell className="py-5">{t.noteNumber ? <span className="font-mono font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg text-sm">{t.noteNumber}</span> : <span className="text-slate-600 italic text-sm">—</span>}</TableCell>
        {userRole !== "SUPPLIER" && <TableCell className="py-5"><span className="text-slate-400 text-sm font-medium">{t.notes || "Transaksi Consignment"}</span></TableCell>}
        <TableCell className="py-5 px-4 text-right"><span className="font-bold text-slate-300 tracking-tight">{formatCurrency(t.revenue)}</span></TableCell>
        <TableCell className="py-5 px-8 text-right"><span className="font-black text-lg tracking-tighter text-emerald-400 group-hover:scale-105 inline-block origin-right transition-transform">+{formatCurrency(t.profit80)}</span></TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="border-white/5 bg-white/[0.01]">
          <TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="py-0">
            <div className="py-4 px-8 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="flex items-center gap-2 mb-3"><Scissors className="w-3.5 h-3.5 text-slate-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Detail Potongan</span></div>
              <div className="flex flex-wrap gap-3">
                <DeductionBadge icon={Barcode} label="Barcode" value={t.barcode} colorClass="bg-rose-500/10 border-rose-500/20 text-rose-400" />
                <DeductionBadge icon={Wrench} label="Service Charge" value={t.serviceCharge || 0} colorClass="bg-orange-500/10 border-orange-500/20 text-orange-400" />
                <DeductionBadge icon={Scissors} label="Kukuluban" value={t.kukuluban || 0} colorClass="bg-purple-500/10 border-purple-500/20 text-purple-400" />
                <DeductionBadge icon={PiggyBank} label="Tabungan" value={t.tabungan || 0} colorClass="bg-sky-500/10 border-sky-500/20 text-sky-400" />
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-500/10 border-slate-500/20 text-slate-400">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex flex-col"><span className="text-[9px] font-black uppercase tracking-widest opacity-60">HPP</span><span className="text-sm font-black tracking-tight">{formatCurrency(t.cost)}</span></div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
