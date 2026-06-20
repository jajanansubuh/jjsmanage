"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  History,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Package,
  Calendar,
  Users,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HistoryItem {
  name: string;
  code: string | null;
  qty: number;
}

interface PrintHistoryRecord {
  id: string;
  supplierId: string;
  supplier: { name: string };
  itemCount: number;
  totalQty: number;
  items: string | HistoryItem[];
  completedAt: string;
  status?: "PENDING" | "DONE";
}

const getSupplierAvatarStyles = (name: string) => {
  const sName = name.toUpperCase();
  let hash = 0;
  for (let i = 0; i < sName.length; i++) {
    hash = sName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-500/20 text-purple-400",
    "bg-gradient-to-br from-blue-500/20 to-sky-500/20 border-blue-500/20 text-blue-400",
    "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/20 text-emerald-400",
    "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/20 text-amber-400",
    "bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-500/20 text-rose-400",
    "bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border-cyan-500/20 text-cyan-400",
    "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/20 text-orange-400"
  ];
  return colors[Math.abs(hash) % colors.length];
};

export function AdminPrintHistory() {
  const [history, setHistory] = useState<PrintHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDateGroup, setSelectedDateGroup] = useState<{
    dateKey: string;
    formattedDate: string;
    records: PrintHistoryRecord[];
  } | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  useEffect(() => {
    if (selectedDateGroup === null) {
      setModalSearchTerm("");
    }
  }, [selectedDateGroup]);

  const handleOpenDateModal = (dateKey: string, formattedDate: string, records: PrintHistoryRecord[]) => {
    setSelectedDateGroup({ dateKey, formattedDate, records });
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/print-queue/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat cetak:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const parseItems = (items: string | HistoryItem[]): HistoryItem[] => {
    if (typeof items === "string") {
      try {
        return JSON.parse(items);
      } catch {
        return [];
      }
    }
    return items;
  };

  const filteredModalRecords = useMemo(() => {
    if (!selectedDateGroup) return [];
    
    let records = selectedDateGroup.records;
    if (modalSearchTerm) {
      const q = modalSearchTerm.toLowerCase();
      records = records.filter((record) => {
        if (record.supplier.name.toLowerCase().includes(q)) return true;
        const items = parseItems(record.items);
        return items.some(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.code && item.code.toLowerCase().includes(q))
        );
      });
    }

    return [...records].sort((a, b) => 
      a.supplier.name.localeCompare(b.supplier.name, "id", { sensitivity: "base" })
    );
  }, [selectedDateGroup, modalSearchTerm]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    const q = searchTerm.toLowerCase();
    return history.filter((record) => {
      if (record.supplier.name.toLowerCase().includes(q)) return true;
      const items = parseItems(record.items);
      return items.some(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q))
      );
    });
  }, [history, searchTerm]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, PrintHistoryRecord[]> = {};
    filteredHistory.forEach((record) => {
      const dateKey = format(new Date(record.completedAt), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });
    return groups;
  }, [filteredHistory]);

  // Summary stats
  const stats = useMemo(() => {
    const uniqueSuppliers = new Set(history.map((h) => h.supplierId));
    const totalItems = history.reduce((sum, h) => sum + h.itemCount, 0);
    const totalQty = history.reduce((sum, h) => sum + h.totalQty, 0);
    return {
      supplierCount: uniqueSuppliers.size,
      totalSessions: history.length,
      totalItems,
      totalQty,
    };
  }, [history]);

  return (
    <div id="admin-print-history" className="space-y-6 pt-6 border-t border-white/5 no-print">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-950/20 animate-in fade-in duration-300">
            <History className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Riwayat Cetak Label
            </h3>
            <p className="text-slate-400 text-xs font-medium">
              Riwayat pengajuan cetak label dari suplier beserta statusnya (Antrean / Selesai).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <Input
              placeholder="Cari suplier atau barang..."
              className="pl-10 pr-4 h-11 bg-slate-900/40 border border-white/5 rounded-xl focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-300 font-medium text-white text-xs placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchHistory}
            className="h-11 w-11 bg-slate-900/40 border border-white/5 hover:border-blue-500/30 text-slate-400 hover:text-white rounded-xl transition-all duration-200"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Supplier Stat Card */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] hover:-translate-y-0.5 group">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/15 group-hover:scale-105 transition-transform duration-300">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Suplier
            </p>
            <p className="text-xl font-black text-white tracking-tight mt-0.5">
              {stats.supplierCount}
            </p>
          </div>
        </div>

        {/* Sessions Stat Card */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.05)] hover:-translate-y-0.5 group">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/15 group-hover:scale-105 transition-transform duration-300">
            <Printer className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Sesi Cetak
            </p>
            <p className="text-xl font-black text-white tracking-tight mt-0.5">
              {stats.totalSessions}
            </p>
          </div>
        </div>

        {/* Total Items Stat Card */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:-translate-y-0.5 group">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15 group-hover:scale-105 transition-transform duration-300">
            <Package className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Total Barang
            </p>
            <p className="text-xl font-black text-white tracking-tight mt-0.5">
              {stats.totalItems}
            </p>
          </div>
        </div>

        {/* Total Qty Stat Card */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] hover:-translate-y-0.5 group">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/15 group-hover:scale-105 transition-transform duration-300">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Total Qty
            </p>
            <p className="text-xl font-black text-white tracking-tight mt-0.5">
              {stats.totalQty}
            </p>
          </div>
        </div>
      </div>

      {/* History List */}
      <Card className="border border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">
                Memuat riwayat...
              </span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium italic">
              Belum ada riwayat cetak label.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {Object.entries(groupedHistory).map(([dateKey, records]) => {
                const dateObj = new Date(dateKey);
                const formattedDate = format(dateObj, "EEEE, dd MMMM yyyy", { locale: localeId });

                return (
                  <div key={dateKey} className="p-0">
                    {/* Date Section Header Button */}
                    <button
                      onClick={() => handleOpenDateModal(dateKey, formattedDate, records)}
                      className="w-full bg-slate-950/45 px-6 py-3 border-y border-white/5 first:border-t-0 flex items-center justify-between group hover:bg-slate-950/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400 group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                          {formattedDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wider bg-white/5 text-slate-400 border border-white/5 uppercase">
                          {records.length} Sesi
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog Modal */}
      <Dialog open={selectedDateGroup !== null} onOpenChange={(open) => { if (!open) setSelectedDateGroup(null); }}>
        <DialogContent className="sm:max-w-4xl w-[90vw] bg-slate-950 border-white/10 text-white shadow-2xl overflow-hidden rounded-3xl flex flex-col max-h-[85vh] p-0">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-white/10 bg-white/2">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                {selectedDateGroup?.formattedDate}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm font-medium mt-2">
                Riwayat sesi cetak pada tanggal ini ({filteredModalRecords.length} Sesi)
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Sub-header with Search Filter */}
          <div className="px-6 md:px-8 py-4 border-b border-white/5 bg-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Daftar Sesi Cetak
            </span>
            <div className="relative w-full sm:w-80 group shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <Input
                placeholder="Cari suplier atau barang..."
                className="pl-10 pr-12 h-10 bg-slate-900/40 border border-white/10 rounded-xl focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-white text-xs placeholder-slate-500"
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
              />
              {modalSearchTerm && (
                <button
                  onClick={() => setModalSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-wider uppercase text-slate-500 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Scrollable Sesi List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-4">
            {filteredModalRecords.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm font-medium italic">
                Tidak ada sesi atau barang yang cocok.
              </div>
            ) : (
              filteredModalRecords.map((record) => {
                const allItems = parseItems(record.items);
                const filteredItems = modalSearchTerm
                  ? allItems.filter(
                      (item) =>
                        item.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                        (item.code && item.code.toLowerCase().includes(modalSearchTerm.toLowerCase()))
                    )
                  : allItems;

                const isExpanded = expandedId === record.id;
                const showItems = isExpanded || (!!modalSearchTerm && filteredItems.length > 0);

                return (
                  <div
                    key={record.id}
                    className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden transition-all duration-200 hover:bg-white/[0.03]"
                  >
                    {/* Session Header Row */}
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : record.id)
                      }
                      className="w-full flex items-center justify-between px-6 py-4 text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner ${getSupplierAvatarStyles(record.supplier.name)}`}>
                          <span className="text-[10px] font-black uppercase">
                            {record.supplier.name.substring(0, 3)}
                          </span>
                        </div>
                        <div className="min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-white text-sm truncate group-hover:text-blue-400 transition-colors uppercase leading-none">
                              {record.supplier.name}
                            </p>
                            {record.status === "PENDING" ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase leading-none">
                                Antrean
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase leading-none">
                                Selesai
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold leading-none mt-0.5">
                            Pukul {format(new Date(record.completedAt), "HH:mm")} WIB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                            <Package className="w-3 h-3" />
                            {record.itemCount} barang
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                            {record.totalQty} pcs
                          </span>
                        </div>
                        {showItems ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                        )}
                      </div>
                    </button>

                    {/* Session Detail (Items) */}
                    {showItems && (
                      <div className="px-6 pb-5 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-inner">
                          <div className="grid grid-cols-[1fr_120px_60px] gap-4 px-5 py-3 bg-white/[0.01] border-b border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                              Nama Barang
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">
                              Barcode
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">
                              Qty
                            </span>
                          </div>
                          <div className="divide-y divide-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="grid grid-cols-[1fr_120px_60px] gap-4 px-5 py-3 hover:bg-white/[0.01] transition-colors"
                              >
                                <span className="text-xs font-bold text-slate-100 truncate uppercase">
                                  {item.name}
                                </span>
                                <span className="text-xs font-mono text-slate-500 text-center">
                                  {item.code || "—"}
                                </span>
                                <span className="text-xs font-black text-white text-right">
                                  {item.qty} <span className="text-[9px] font-medium text-slate-500">pcs</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
