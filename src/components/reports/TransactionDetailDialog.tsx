import { FileText, Printer, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-8 border-b border-white/5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" /> {isDeductionModal ? "Detail Potongan:" : "Detail Nota:"} {selectedNote}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5">
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Nota</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Suplier</TableHead>
                {userRole !== "SUPPLIER" && <TableHead className="text-[10px] font-black uppercase text-slate-500">Catatan</TableHead>}
                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Pendapatan</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">S.Charge</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Kukuluban</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Tabungan</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 text-emerald-400">Net Mitra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {noteDetails.map((d) => (
                <TableRow key={d.id} className="border-white/5">
                  <TableCell className="font-mono text-[10px] text-slate-500">{d.noteNumber || "-"}</TableCell>
                  <TableCell className="font-bold text-white">{d.supplier?.name}</TableCell>
                  {userRole !== "SUPPLIER" && <TableCell className="text-slate-400 text-xs max-w-[150px] truncate">{d.notes || "-"}</TableCell>}
                  <TableCell className="text-right text-slate-300">{new Intl.NumberFormat("id-ID").format(d.revenue)}</TableCell>
                  <TableCell className="text-right text-slate-400">{new Intl.NumberFormat("id-ID").format(d.serviceCharge || 0)}</TableCell>
                  <TableCell className="text-right text-slate-400">{new Intl.NumberFormat("id-ID").format(d.kukuluban || 0)}</TableCell>
                  <TableCell className="text-right text-slate-400">{new Intl.NumberFormat("id-ID").format(d.tabungan || 0)}</TableCell>
                  <TableCell className="text-right font-black text-emerald-400">{new Intl.NumberFormat("id-ID").format(d.profit80)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-6 border-t border-white/5 flex justify-end gap-3">
          {userRole !== "SUPPLIER" && (
            <>
              <Button
                onClick={onReprint}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-6"
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Ulang
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
                className={`${isDeductionModal ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"} text-white font-bold rounded-xl h-11 px-6`}
              >
                {isDeductionModal ? <Save className="w-4 h-4 mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                {isDeductionModal ? "Edit Potongan" : "Edit Transaksi"}
              </Button>
            </>
          )}
          <Button onClick={() => onOpenChange(false)} className="bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-11 px-8">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
