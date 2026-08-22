import { AlertCircle, CheckCircle, Save, Users, Receipt, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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
      <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-zinc-800 rounded-[2.5rem] shadow-2xl max-w-xl p-0 overflow-hidden text-white">
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                  Konfirmasi Simpan Potongan
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs font-medium mt-0.5">
                  Periksa ringkasan data potongan sebelum disimpan ke sistem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Meta Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">No. Nota</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{deductionNoteNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Tgl. Potongan</span>
              <span className="font-bold text-slate-200">{formattedDeductionDate}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Periode Transaksi</span>
              <span className="font-bold text-slate-200">{formattedPeriod}</span>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Mitra</span>
              <span className="text-xl font-black text-white">{rows.length}</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <Scissors className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Mitra Terpotong</span>
              <span className="text-xl font-black text-rose-300">{affectedSuppliers.length}</span>
            </div>
          </div>

          {/* Totals Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-zinc-950 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Total Service Charge:</span>
              <span className="font-bold text-rose-400">Rp {new Intl.NumberFormat("id-ID").format(totals.serviceCharge)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Total Kukuluban:</span>
              <span className="font-bold text-orange-400">Rp {new Intl.NumberFormat("id-ID").format(totals.kukuluban)}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-black">
              <span className="text-white uppercase tracking-wider">Grand Total Potongan:</span>
              <span className="text-rose-400 text-base">Rp {new Intl.NumberFormat("id-ID").format(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto h-12 px-6 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold transition-all cursor-pointer"
          >
            Batal / Periksa Kembali
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black shadow-lg shadow-rose-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Ya, Simpan Potongan</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
