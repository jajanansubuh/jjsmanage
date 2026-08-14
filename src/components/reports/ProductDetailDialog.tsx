import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProductDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProdukNote: any;
}

export function ProductDetailDialog({
  isOpen,
  onOpenChange,
  selectedProdukNote
}: ProductDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-[950px] text-white flex flex-col max-h-[85vh] overflow-hidden p-0">
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Detail Produk:</span>
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-xl text-base font-bold">
                    {selectedProdukNote?.noteNumber}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  Rincian penjualan per item produk untuk nomor nota ini.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-zinc-900/40">
            <Table>
              <TableHeader className="bg-zinc-900/90 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-b border-white/10">
                  <TableHead className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Nama Barang</TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Beli</TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Jual</TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Retur</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Persentase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProdukNote?.products.map((p: any, idx: number) => {
                  const sellRate = p.totalBeli > 0 ? ((p.totalJual / p.totalBeli) * 100).toFixed(1) : "0";
                  return (
                    <TableRow key={idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors duration-150">
                      <TableCell className="py-3 px-4 font-bold text-white text-sm">{p.name}</TableCell>
                      <TableCell className="py-3 px-4 text-center font-bold text-slate-300 tabular-nums">{p.totalBeli}</TableCell>
                      <TableCell className="py-3 px-4 text-center font-black text-emerald-400 tabular-nums">{p.totalJual}</TableCell>
                      <TableCell className="py-3 px-4 text-center font-bold text-rose-400 tabular-nums">{p.totalRetureJual}</TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <span className="font-bold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-xs tabular-nums">{sellRate}%</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex justify-end shrink-0">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="bg-zinc-800 hover:bg-zinc-700 text-slate-200 hover:text-white font-bold rounded-xl h-10 px-6 border border-white/10 transition-all active:scale-95 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

