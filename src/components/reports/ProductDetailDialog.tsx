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
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-[1000px] text-white flex flex-col max-h-[90vh] overflow-hidden p-0">
        <div className="p-8 border-b border-white/5 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
              <Package className="w-6 h-6 text-emerald-400" />
              Detail Produk: {selectedProdukNote?.noteNumber}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Rincian penjualan per item produk untuk nomor nota ini.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5">
                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Barang</TableHead>
                <TableHead className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Beli</TableHead>
                <TableHead className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Jual</TableHead>
                <TableHead className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Reture</TableHead>
                <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Persentase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProdukNote?.products.map((p: any, idx: number) => {
                const sellRate = p.totalBeli > 0 ? ((p.totalJual / p.totalBeli) * 100).toFixed(1) : "0";
                return (
                  <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="py-4 font-black text-white">{p.name}</TableCell>
                    <TableCell className="py-4 text-center font-bold text-slate-400">{p.totalBeli}</TableCell>
                    <TableCell className="py-4 text-center font-black text-emerald-400">{p.totalJual}</TableCell>
                    <TableCell className="py-4 text-center font-bold text-rose-400">{p.totalRetureJual}</TableCell>
                    <TableCell className="py-4 text-right">
                      <span className="font-black text-white">{sellRate}%</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0">
          <Button onClick={() => onOpenChange(false)} className="bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-11 px-8">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
