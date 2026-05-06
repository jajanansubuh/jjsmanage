"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  History, Clock, FileText, TrendingUp, 
  ChevronDown, ChevronUp, Scissors, Barcode, 
  PiggyBank, Wrench 
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PayoutHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId?: string;
  supplierName?: string;
}

interface TransactionRecord {
  id: string;
  date: string;
  noteNumber: string | null;
  revenue: number;
  profit80: number;
  profit20: number;
  cost: number;
  barcode: number;
  serviceCharge: number | null;
  kukuluban: number | null;
  tabungan: number | null;
  notes: string | null;
}

function DeductionPill({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  if (!value || value === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black", colorClass)}>
      {label}: -{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value)}
    </span>
  );
}

export function PayoutHistoryModal({ 
  isOpen, 
  onOpenChange, 
  supplierId, 
  supplierName 
}: PayoutHistoryModalProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
      setExpandedRows(new Set());
    }
  }, [isOpen, supplierId]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (supplierId) params.set("supplierId", supplierId);
      
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalProfit80 = transactions.reduce((sum, t) => sum + t.profit80, 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + t.revenue, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  const hasDeductions = (t: TransactionRecord) =>
    (t.barcode && t.barcode > 0) || 
    (t.serviceCharge && t.serviceCharge > 0) || 
    (t.kukuluban && t.kukuluban > 0) || 
    (t.tabungan && t.tabungan > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl max-w-3xl p-0 overflow-hidden text-white">
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
              <History className="w-6 h-6 text-amber-400" />
              Riwayat Transaksi
              {supplierName && <span className="text-amber-400/50 ml-1">— {supplierName}</span>}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Seluruh transaksi consignment yang diinput oleh Admin{supplierName ? ` untuk ${supplierName}` : ""}. Klik baris untuk detail potongan.
            </DialogDescription>
          </DialogHeader>

          {/* Summary row */}
          {!loading && transactions.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300">{transactions.length} Transaksi</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-300">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl">
                <History className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">{formatCurrency(totalProfit80)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-0 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-white/5">
                <TableHead className="py-4 pl-6 pr-1 w-8">
                  <span className="sr-only">Detail</span>
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nota</TableHead>
                <TableHead className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Omzet</TableHead>
                <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Mitra Jjs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium text-sm">Memuat riwayat transaksi...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-500 italic">
                    Belum ada riwayat transaksi.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => {
                  const isExpanded = expandedRows.has(t.id);
                  const showExpand = hasDeductions(t);

                  return (
                    <Fragment key={t.id}>
                      <TableRow 
                        key={t.id} 
                        className={cn(
                          "border-white/5 transition-colors group",
                          showExpand ? "cursor-pointer hover:bg-white/[0.03]" : "hover:bg-white/[0.02]",
                          isExpanded && "bg-white/[0.03]"
                        )}
                        onClick={() => showExpand && toggleRow(t.id)}
                      >
                        <TableCell className="py-3 pl-6 pr-1">
                          {showExpand ? (
                            <div className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center transition-all",
                              isExpanded ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-600"
                            )}>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                          ) : (
                            <div className="w-5 h-5" />
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-amber-400 transition-colors text-sm">
                              {format(new Date(t.date), "dd MMM yyyy", { locale: id })}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {format(new Date(t.date), "HH:mm")} WIB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {t.noteNumber ? (
                            <span className="font-mono font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded text-xs">
                              {t.noteNumber}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-bold text-slate-300 text-sm">
                          {formatCurrency(t.revenue)}
                        </TableCell>
                        <TableCell className="py-3 px-6 text-right font-black text-emerald-400">
                          +{formatCurrency(t.profit80)}
                        </TableCell>
                      </TableRow>

                      {/* Expanded deductions detail */}
                      {isExpanded && (
                        <TableRow key={`${t.id}-detail`} className="border-white/5 bg-white/[0.01]">
                          <TableCell colSpan={5} className="py-0">
                            <div className="py-3 px-6 animate-in slide-in-from-top-1 fade-in duration-200">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Scissors className="w-3 h-3 text-slate-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Potongan & Detail</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <DeductionPill label="Barcode" value={t.barcode} colorClass="bg-rose-500/10 text-rose-400" />
                                <DeductionPill label="Jasa" value={t.serviceCharge || 0} colorClass="bg-orange-500/10 text-orange-400" />
                                <DeductionPill label="Kukuluban" value={t.kukuluban || 0} colorClass="bg-purple-500/10 text-purple-400" />
                                <DeductionPill label="Tabungan" value={t.tabungan || 0} colorClass="bg-sky-500/10 text-sky-400" />
                                
                                {/* Extra context */}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400">
                                  HPP: {formatCurrency(t.cost)}
                                </span>
                              </div>
                              {t.notes && (
                                <p className="text-xs text-slate-500 mt-2 italic">📝 {t.notes}</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="rounded-xl px-8 font-bold bg-white/5 hover:bg-white/10 text-white">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
