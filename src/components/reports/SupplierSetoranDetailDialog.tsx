import { History } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SupplierSetoranDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSupplier: any;
}

export function SupplierSetoranDetailDialog({
  isOpen,
  onOpenChange,
  selectedSupplier
}: SupplierSetoranDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl max-w-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
            <History className="w-6 h-6 text-indigo-400" />
            Detail Setoran
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium">
            Rincian setoran yang sudah divalidasi untuk <span className="text-indigo-400 font-bold">{selectedSupplier?.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-white/5">
                <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</TableHead>
                <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Jumlah Setoran</TableHead>
                <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Metode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedSupplier?.data.map((d: any, idx: number) => (
                <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="py-4 px-6 font-bold text-white">{format(new Date(d.date), "dd MMMM yyyy", { locale: id })}</TableCell>
                  <TableCell className="py-4 text-right font-black text-emerald-400">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(d.amount)}</TableCell>
                  <TableCell className="py-4 px-6 text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest">{d.paymentMethod}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
