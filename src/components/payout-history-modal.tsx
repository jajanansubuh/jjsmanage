"use client";

import { useState, useEffect } from "react";
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
import { History, Clock } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface PayoutHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId?: string;
  supplierName?: string;
}

export function PayoutHistoryModal({ 
  isOpen, 
  onOpenChange, 
  supplierId, 
  supplierName 
}: PayoutHistoryModalProps) {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPayouts();
    }
  }, [isOpen, supplierId]);

  async function fetchPayouts() {
    setLoading(true);
    try {
      const url = supplierId 
        ? `/api/payouts?supplierId=${supplierId}` 
        : '/api/payouts';
      const res = await fetch(url);
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl max-w-2xl p-0 overflow-hidden text-white">
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
              <History className="w-6 h-6 text-amber-400" />
              Riwayat Penarikan Saldo
              {supplierName && <span className="text-amber-400/50 ml-1">— {supplierName}</span>}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Daftar dana yang telah ditransfer {supplierName ? "ke suplier ini" : "ke rekening Anda"}.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-0 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-white/5">
                <TableHead className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal & Waktu</TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Keterangan</TableHead>
                <TableHead className="py-4 px-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-20 text-slate-500">Memuat riwayat...</TableCell></TableRow>
              ) : payouts.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-20 text-slate-500 italic">Belum ada riwayat penarikan.</TableCell></TableRow>
              ) : (
                payouts.map((p) => (
                  <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4 px-8 font-bold text-white group-hover:text-amber-400 transition-colors">
                      <div className="flex flex-col">
                        <span>{format(new Date(p.date), "dd MMM yyyy", { locale: id })}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(p.date), "HH:mm")} WIB
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-400 text-sm">
                      {p.notes || "Transfer Bagi Hasil"}
                    </TableCell>
                    <TableCell className="py-4 px-8 text-right font-black text-amber-400">
                      -{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(p.amount)}
                    </TableCell>
                  </TableRow>
                ))
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
