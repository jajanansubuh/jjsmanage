"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  History, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2,
  RefreshCw
} from "lucide-react";

interface PrintHistoryItem {
  id: string;
  name: string;
  code: string | null;
  qty: number;
  status: "PENDING" | "DONE";
  createdAt: string;
}

export function SupplierPrintHistory() {
  const [history, setHistory] = useState<PrintHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/print-queue?status=ALL");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat cetak:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [history, searchTerm]);

  const paginatedHistory = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, page]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  }, [filteredHistory]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-4 pt-4 border-t border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <History className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Riwayat Permintaan Label</h3>
            <p className="text-slate-500 text-xs font-medium">Log antrean cetak Anda yang sedang diajukan atau sudah dicetak oleh Admin.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
            <Input
              placeholder="Cari riwayat..."
              className="pl-9 pr-3 h-10 bg-slate-950/40 border-white/5 rounded-xl focus:ring-purple-500/20 focus:border-purple-500/50 transition-all font-medium text-white text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchHistory}
            className="h-10 w-10 bg-slate-900/40 border-white/5 text-slate-400 hover:text-white rounded-xl"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </Button>
        </div>
      </div>

      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/2">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-4 px-6 font-black text-[9px] uppercase tracking-[0.2em] text-slate-500">Tanggal Diajukan</TableHead>
                  <TableHead className="py-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-500">Nama Barang</TableHead>
                  <TableHead className="py-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 text-center">Barcode</TableHead>
                  <TableHead className="py-4 text-center font-black text-[9px] uppercase tracking-[0.2em] text-slate-500">Jumlah (Qty)</TableHead>
                  <TableHead className="py-4 px-6 text-right font-black text-[9px] uppercase tracking-[0.2em] text-slate-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-slate-500 font-medium">Memuat riwayat...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-slate-500 text-xs font-medium italic">
                      Belum ada riwayat cetak label.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHistory.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/1 transition-all duration-200 group">
                      <TableCell className="py-4 px-6">
                        <span className="font-bold text-slate-400 text-xs group-hover:text-slate-300">
                          {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-sm text-white uppercase group-hover:text-purple-400 transition-colors">
                          {item.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-slate-400 text-xs font-bold group-hover:text-slate-300">
                          {item.code || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-white text-xs bg-slate-950/60 py-1 px-3 rounded-full border border-white/5">
                          {item.qty} pcs
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        {item.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" /> Antrean
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredHistory.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-950/20">
              <span className="text-xs text-slate-500 font-medium">Halaman {page} dari {totalPages}</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="bg-transparent border-white/10 text-white hover:bg-white/5 h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} 
                  className="bg-transparent border-white/10 text-white hover:bg-white/5 h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
