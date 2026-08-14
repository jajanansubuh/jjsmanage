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
      <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-4xl max-w-4xl text-white flex flex-col max-h-[85vh] overflow-hidden p-0">
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Detail Tabungan:</span>
                  <span className="font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-xl text-base font-bold">
                    {selectedTabunganNote?.noteNumber}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  Rincian potongan tabungan per suplier untuk nomor nota ini.
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
                  <TableHead className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Nama Suplier</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Omzet</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-blue-400">Potongan Tabungan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTabunganNote?.suppliers.map((s: any, idx: number) => (
                  <TableRow key={idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors duration-150">
                    <TableCell className="py-3 px-4 font-bold text-white text-sm">{s.name}</TableCell>
                    <TableCell className="py-3 px-4 text-right font-bold text-slate-300 tabular-nums">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.revenue)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-black text-blue-400 tabular-nums">
                      + {new Intl.NumberFormat("id-ID").format(s.tabungan)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3 shrink-0">
          {userRole !== "SUPPLIER" && (
            <Button
              onClick={onReprint}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-10 px-5 flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all border-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak Ulang
            </Button>
          )}
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

