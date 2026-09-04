import { CheckCircle2, Printer, Check, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface SavingsSaveSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  savedNoteInfo: any;
  onPrint: () => void;
  onFinish: () => void;
}

export function SavingsSaveSuccessDialog({
  isOpen,
  onOpenChange,
  savedNoteInfo,
  onPrint,
  onFinish
}: SavingsSaveSuccessDialogProps) {
  const formattedDate = savedNoteInfo?.date
    ? format(new Date(savedNoteInfo.date), "dd MMMM yyyy", { locale: localeId })
    : "-";

  const formattedPeriod =
    savedNoteInfo?.startDate && savedNoteInfo?.endDate
      ? `${format(new Date(savedNoteInfo.startDate), "dd/MM")} - ${format(new Date(savedNoteInfo.endDate), "dd/MM/yyyy")}`
      : "-";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl max-w-md p-6 text-white sm:max-w-md">
        <DialogHeader className="text-center space-y-1.5 pt-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-white text-center">
            Tabungan Berhasil Disimpan
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs text-center">
            Rincian nota tabungan mitra telah tersimpan ke sistem.
          </DialogDescription>
        </DialogHeader>

        {/* Ringkasan Informasi */}
        <div className="my-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 divide-y divide-zinc-800/60 text-xs">
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">No. Nota</span>
            <span className="font-mono font-bold text-blue-400">{savedNoteInfo?.noteNumber}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Tanggal</span>
            <span className="font-medium text-zinc-200">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Periode</span>
            <span className="font-medium text-zinc-200">{formattedPeriod}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-zinc-400">Mitra Menabung</span>
            <span className="font-semibold text-emerald-400">
              {savedNoteInfo?.totals?.saversCount || 0} Mitra
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-zinc-900/90 rounded-b-xl">
            <span className="font-bold text-zinc-200 text-xs uppercase tracking-wide">Total Tabungan</span>
            <span className="text-base font-bold text-blue-400 tabular-nums">
              Rp {new Intl.NumberFormat("id-ID").format(savedNoteInfo?.totals?.tabungan || 0)}
            </span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            onClick={onPrint}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Nota Tabungan</span>
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
