import { Coins, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SavingsDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTabunganNote: any;
  userRole: string | null;
  onReprint: () => void;
}

export function SavingsDetailDialog({
  isOpen,
  onOpenChange,
  selectedTabunganNote,
  userRole,
  onReprint
}: SavingsDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-[800px] text-white flex flex-col max-h-[90vh] overflow-hidden p-0">
        <div className="p-8 border-b border-white/5 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
              <Coins className="w-6 h-6 text-purple-400" />
              Detail Tabungan: {selectedTabunganNote?.noteNumber}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Rincian potongan tabungan per suplier untuk nomor nota ini.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5">
                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Suplier</TableHead>
                <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Omzet</TableHead>
                <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 text-purple-400">Potongan Tabungan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedTabunganNote?.suppliers.map((s: any, idx: number) => (
                <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="py-4 font-black text-white">{s.name}</TableCell>
                  <TableCell className="py-4 text-right font-bold text-slate-400">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.revenue)}</TableCell>
                  <TableCell className="py-4 text-right font-black text-purple-400">+ {new Intl.NumberFormat("id-ID").format(s.tabungan)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0">
          {userRole !== "SUPPLIER" && (
            <Button
              onClick={onReprint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-6"
            >
              <Printer className="w-4 h-4 mr-2" /> Cetak Ulang
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} className="bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-11 px-8">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
