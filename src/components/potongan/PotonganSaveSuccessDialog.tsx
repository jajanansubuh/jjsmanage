import { CheckCircle2, Printer, Check, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface PotonganSaveSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  savedNoteInfo: any;
  onPrint: () => void;
  onFinish: () => void;
}

export function PotonganSaveSuccessDialog({
  isOpen,
  onOpenChange,
  savedNoteInfo,
  onPrint,
  onFinish
}: PotonganSaveSuccessDialogProps) {
  const formattedDate = savedNoteInfo?.date
    ? format(new Date(savedNoteInfo.date), "dd MMMM yyyy", { locale: localeId })
    : "-";

  const formattedPeriod =
    savedNoteInfo?.startDate && savedNoteInfo?.endDate
      ? `${format(new Date(savedNoteInfo.startDate), "dd/MM")} - ${format(new Date(savedNoteInfo.endDate), "dd/MM/yyyy")}`
      : "-";

  const affectedCount = (savedNoteInfo?.details || []).filter(
    (r: any) => (r.serviceCharge || 0) > 0 || (r.kukuluban || 0) > 0
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl max-w-md p-6 text-white sm:max-w-md">
        <DialogHeader className="text-center space-y-1.5 pt-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-white text-center">
            Potongan Berhasil Disimpan
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs text-center">
            Rincian nota potongan mitra telah tersimpan ke sistem.
          </DialogDescription>
        </DialogHeader>

        {/* Ringkasan Informasi */}
        <div className="my-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 divide-y divide-zinc-800/60 text-xs">
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">No. Nota</span>
            <span className="font-mono font-bold text-rose-400">{savedNoteInfo?.noteNumber}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Tanggal</span>
            <span className="font-medium text-zinc-200">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Periode</span>
            <span className="font-medium text-zinc-200">{formattedPeriod}</span>
          </div>
          {affectedCount > 0 && (
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-zinc-400">Mitra Terpotong</span>
              <span className="font-semibold text-rose-400">{affectedCount} Mitra</span>
            </div>
          )}
          <div className="flex justify-between items-center px-4 py-3 bg-zinc-900/90 rounded-b-xl">
            <span className="font-bold text-zinc-200 text-xs uppercase tracking-wide">Grand Total Potongan</span>
            <span className="text-base font-bold text-rose-400 tabular-nums">
              Rp {new Intl.NumberFormat("id-ID").format(savedNoteInfo?.totals?.grandTotal || 0)}
            </span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            onClick={onPrint}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl h-10 text-xs font-semibold shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Nota Potongan</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onFinish}
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl h-10 px-4 text-xs font-medium cursor-pointer"
          >
            <Check className="w-4 h-4 mr-1" /> Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
