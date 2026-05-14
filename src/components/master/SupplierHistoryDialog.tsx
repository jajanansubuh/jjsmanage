import { History } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface SupplierHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSupplier: any;
  historyLoading: boolean;
  supplierHistory: any[];
}

export function SupplierHistoryDialog({
  isOpen,
  onOpenChange,
  selectedSupplier,
  historyLoading,
  supplierHistory
}: SupplierHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-[1200px] sm:ml-32 max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-8 border-b border-white/5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
              <History className="w-6 h-6 text-blue-400" />
              Riwayat Transaksi: {selectedSupplier?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Daftar transaksi bagi hasil yang telah tercatat.</DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 pt-0 scrollbar-hide">
          {historyLoading ? (
            <div className="space-y-4 pt-6 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 w-full bg-white/5 rounded-2xl border border-white/5" />
              ))}
            </div>
          ) : supplierHistory.length === 0 ? (
            <div className="text-center py-20 text-slate-500 font-medium italic animate-in fade-in zoom-in-95 duration-200">
              Belum ada riwayat transaksi untuk suplier ini.
            </div>
          ) : (
            <div className="space-y-4 pt-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
              <Table>
                <TableHeader className="bg-white/[0.02] sticky top-0 z-10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Tanggal</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right">Pendapatan</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right">Cost</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right">Potongan</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right text-blue-400">Mitra Jjs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierHistory.map((h) => {
                    const totalDeductions = (h.serviceCharge || 0) + (h.kukuluban || 0) + (h.tabungan || 0);
                    return (
                      <TableRow key={h.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                        <TableCell className="text-slate-300 font-medium py-4">
                          {format(new Date(h.date), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-right text-slate-300">
                          {new Intl.NumberFormat("id-ID").format(h.revenue)}
                        </TableCell>
                        <TableCell className="text-right text-slate-400 italic">
                          {new Intl.NumberFormat("id-ID").format(h.cost)}
                        </TableCell>
                        <TableCell className="text-right text-red-400/70 text-xs">
                          -{new Intl.NumberFormat("id-ID").format(totalDeductions)}
                        </TableCell>
                        <TableCell className="text-right font-black text-blue-400">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(h.profit80)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-11 px-8 rounded-xl text-white bg-white/5 hover:bg-white/10 font-bold">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
