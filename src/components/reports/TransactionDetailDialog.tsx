import { useMemo } from "react";
import { FileText, Printer, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface TransactionDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNote: string | null;
  noteDetails: any[];
  userRole: string | null;
  isDeductionModal: boolean;
  onReprint: () => void;
}

export function TransactionDetailDialog({
  isOpen,
  onOpenChange,
  selectedNote,
  noteDetails,
  userRole,
  isDeductionModal,
  onReprint
}: TransactionDetailDialogProps) {
  const router = useRouter();

  const totals = useMemo(() => {
    return noteDetails.reduce(
      (acc, d) => ({
        revenue: acc.revenue + (Number(d.revenue) || 0),
        serviceCharge: acc.serviceCharge + (Number(d.serviceCharge) || 0),
        kukuluban: acc.kukuluban + (Number(d.kukuluban) || 0),
        tabungan: acc.tabungan + (Number(d.tabungan) || 0),
        profit80: acc.profit80 + (Number(d.profit80) || 0),
      }),
      { revenue: 0, serviceCharge: 0, kukuluban: 0, tabungan: 0, profit80: 0 }
    );
  }, [noteDetails]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-[1050px] max-h-[85vh] overflow-hidden flex flex-col p-0 text-white">
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{isDeductionModal ? "Detail Potongan:" : "Detail Nota:"}</span>
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-xl text-base font-bold">
                    {selectedNote}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  Rincian perolehan dan potongan per suplier untuk nota ini.
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
                  <TableHead className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Nota</TableHead>
                  <TableHead className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Suplier</TableHead>
                  {userRole !== "SUPPLIER" && (
                    <TableHead className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Catatan</TableHead>
                  )}
                  <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Pendapatan</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">S.Charge</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Kukuluban</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Tabungan</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-emerald-400">Net Mitra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {noteDetails.map((d) => (
                  <TableRow key={d.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors duration-150">
                    <TableCell className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-slate-200 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg inline-block">
                        {d.noteNumber || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 font-bold text-white text-sm">{d.supplier?.name}</TableCell>
                    {userRole !== "SUPPLIER" && (
                      <TableCell className="py-3 px-4 text-slate-400 text-xs max-w-[150px] truncate">{d.notes || "-"}</TableCell>
                    )}
                    <TableCell className="py-3 px-4 text-right text-slate-200 font-medium tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(d.revenue)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-slate-400 tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(d.serviceCharge || 0)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-slate-400 tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(d.kukuluban || 0)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-slate-400 tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(d.tabungan || 0)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-black text-emerald-400 tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(d.profit80)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {noteDetails.length > 0 && (
                <TableFooter className="bg-emerald-950/20 border-t-2 border-emerald-500/30">
                  <TableRow>
                    <TableCell colSpan={userRole !== "SUPPLIER" ? 3 : 2} className="py-3.5 px-4 font-bold text-white text-xs uppercase tracking-wider">
                      Total ({noteDetails.length} Suplier)
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right font-bold text-slate-100 tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(totals.revenue)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right font-bold text-slate-300 tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(totals.serviceCharge)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right font-bold text-slate-300 tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(totals.kukuluban)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right font-bold text-slate-300 tabular-nums text-sm">
                      {new Intl.NumberFormat("id-ID").format(totals.tabungan)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right font-black text-emerald-400 tabular-nums text-base">
                      {new Intl.NumberFormat("id-ID").format(totals.profit80)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
          {userRole !== "SUPPLIER" && (
            <>
              <Button
                onClick={onReprint}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-10 px-5 flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all outline-none border-0 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Ulang
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  if (isDeductionModal) {
                    router.push(`/potongan?edit=${selectedNote}`);
                  } else {
                    router.push(`/transactions?edit=${selectedNote}`);
                  }
                }}
                className={`${
                  isDeductionModal 
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20" 
                    : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                } text-white font-bold rounded-xl h-10 px-5 flex items-center gap-2 shadow-lg active:scale-95 transition-all outline-none border-0 cursor-pointer`}
              >
                {isDeductionModal ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                {isDeductionModal ? "Edit Potongan" : "Edit Transaksi"}
              </Button>
            </>
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

