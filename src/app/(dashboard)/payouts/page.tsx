"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  Clock, 
  ArrowLeft,
  Download,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayouts() {
      setLoading(true);
      try {
        const res = await fetch('/api/payouts');
        if (res.ok) {
          const data = await res.json();
          setPayouts(data);
        }
      } catch (error) {
        console.error("Failed to fetch payouts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayouts();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-slate-500 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Finansial</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white">
            Riwayat <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-orange-400">Penarikan</span>
          </h2>
          <p className="text-slate-400 font-medium">Daftar seluruh dana yang telah ditransfer ke rekening Anda.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-white/5 bg-slate-900/50 text-white hover:bg-white/5 font-bold">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button variant="outline" className="rounded-xl border-white/5 bg-slate-900/50 text-white hover:bg-white/5 font-bold">
            <Download className="w-4 h-4 mr-2" /> Ekspor
          </Button>
        </div>
      </div>

      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Tanggal & Waktu</TableHead>
                <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Keterangan Transfer</TableHead>
                <TableHead className="py-6 px-8 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Jumlah Dana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-24 text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium">Memuat riwayat transfer...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-24 text-slate-500 font-medium italic">
                    Belum ada riwayat penarikan saldo.
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((p) => (
                  <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02] transition-all duration-300 group">
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col">
                        <span className="font-black text-white group-hover:text-amber-400 transition-colors">
                          {format(new Date(p.date), "dd MMMM yyyy", { locale: id })}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(p.date), "HH:mm")} WIB
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                        {p.notes || "Transfer Bagi Hasil Consignment"}
                      </span>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <span className="font-black text-xl tracking-tighter text-amber-400 group-hover:scale-105 inline-block origin-right transition-transform">
                        -{new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0
                        }).format(p.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
