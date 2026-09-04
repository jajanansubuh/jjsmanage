import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Check, Loader2, Scissors } from "lucide-react";

interface PotonganConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deductionNoteNumber: string;
  deductionDate: string;
  startDate: string;
  endDate: string;
  rows: any[];
  totals: {
    serviceCharge: number;
    kukuluban: number;
    grandTotal: number;
  };
  onConfirm: () => void;
  isSaving: boolean;
}

export function PotonganConfirmDialog({
  isOpen,
  onOpenChange,
  deductionNoteNumber,
  deductionDate,
  startDate,
  endDate,
  rows,
  totals,
  onConfirm,
  isSaving,
}: PotonganConfirmDialogProps) {
  const formattedDeductionDate = deductionDate
    ? format(new Date(deductionDate), "dd MMMM yyyy", { locale: localeId })
    : "-";

  const formattedPeriod =
    startDate && endDate
      ? startDate === endDate
        ? format(new Date(startDate), "dd MMMM yyyy", { locale: localeId })
        : `${format(new Date(startDate), "dd MMM", { locale: localeId })} - ${format(new Date(endDate), "dd MMM yyyy", { locale: localeId })}`
      : "-";

  const affectedSuppliers = rows.filter(r => (r.serviceCharge || 0) > 0 || (r.kukuluban || 0) > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl max-w-md p-6 text-white sm:max-w-md">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Scissors className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Konfirmasi Simpan Potongan
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs">
            Pastikan data potongan mitra sudah sesuai sebelum disimpan ke database.
          </DialogDescription>
        </DialogHeader>

        {/* Ringkasan Informasi */}
        <div className="my-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 divide-y divide-zinc-800/60 text-xs">
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">No. Nota</span>
            <span className="font-mono font-bold text-rose-400">{deductionNoteNumber}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Tanggal Potongan</span>
            <span className="font-medium text-zinc-200">{formattedDeductionDate}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Periode Transaksi</span>
            <span className="font-medium text-zinc-200">{formattedPeriod}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Total Mitra</span>
            <span className="font-medium text-zinc-200">{rows.length} Mitra</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Mitra Terpotong</span>
            <span className="font-semibold text-rose-400">{affectedSuppliers.length} Mitra</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Service Charge</span>
            <span className="font-medium text-zinc-200">
              Rp {new Intl.NumberFormat("id-ID").format(totals.serviceCharge)}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Kukuluban</span>
            <span className="font-medium text-zinc-200">
              Rp {new Intl.NumberFormat("id-ID").format(totals.kukuluban)}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-zinc-900/90 rounded-b-xl">
            <span className="font-bold text-zinc-200 text-xs uppercase tracking-wide">Grand Total Potongan</span>
            <span className="text-base font-bold text-rose-400 tabular-nums">
              Rp {new Intl.NumberFormat("id-ID").format(totals.grandTotal)}
            </span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <DialogFooter className="flex-row justify-end gap-2.5 sm:gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="flex-1 sm:flex-none border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl h-10 px-4 text-xs font-medium cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-500 text-white rounded-xl h-10 px-5 text-xs font-semibold shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Ya, Simpan</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
