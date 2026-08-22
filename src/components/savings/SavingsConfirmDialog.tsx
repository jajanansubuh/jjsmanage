import { AlertCircle, CheckCircle, Save, Users, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface SavingsConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  savingsNoteNumber: string;
  savingsDate: string;
  startDate: string;
  endDate: string;
  rows: any[];
  totals: {
    tabungan: number;
    saversCount: number;
    totalSuppliers: number;
  };
  onConfirm: () => void;
  isSaving: boolean;
}

export function SavingsConfirmDialog({
  isOpen,
  onOpenChange,
  savingsNoteNumber,
  savingsDate,
  startDate,
  endDate,
  rows,
  totals,
  onConfirm,
  isSaving,
}: SavingsConfirmDialogProps) {
  const savers = rows.filter((r) => Number(r.tabungan || 0) > 0);
  const nonSavers = rows.filter((r) => Number(r.tabungan || 0) === 0);

  const formattedSavingsDate = savingsDate
    ? format(new Date(savingsDate), "dd MMMM yyyy", { locale: localeId })
    : "-";

  const formattedPeriod =
    startDate && endDate
      ? startDate === endDate
        ? format(new Date(startDate), "dd MMMM yyyy", { locale: localeId })
        : `${format(new Date(startDate), "dd MMM", { locale: localeId })} - ${format(new Date(endDate), "dd MMM yyyy", { locale: localeId })}`
      : "-";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-zinc-800 rounded-[2.5rem] shadow-2xl max-w-xl p-0 overflow-hidden text-white">
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                  Konfirmasi Simpan Tabungan
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs font-medium mt-0.5">
                  Periksa ringkasan tabungan mitra sebelum disimpan ke sistem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Meta Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">No. Nota</span>
              <span className="font-mono font-bold text-blue-400 text-sm">{savingsNoteNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Tgl. Tabungan</span>
              <span className="font-bold text-slate-200">{formattedSavingsDate}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Periode Transaksi</span>
              <span className="font-bold text-slate-200">{formattedPeriod}</span>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Mitra</span>
              <span className="text-xl font-black text-white">{rows.length}</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
              <Coins className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Menabung</span>
              <span className="text-xl font-black text-blue-300">{savers.length}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <AlertCircle className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tidak Nabung</span>
              <span className="text-xl font-black text-slate-400">{nonSavers.length}</span>
            </div>
          </div>

          {/* Savers Preview if any */}
          {savers.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Daftar Mitra yang Menabung ({savers.length} mitra):</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {savers.map((s) => (
                  <span
                    key={s.supplierId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-300"
                  >
                    <span>{s.supplierName}</span>
                    <span className="font-mono text-white/90">Rp {new Intl.NumberFormat("id-ID").format(s.tabungan)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Totals Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-zinc-950 border border-white/10 flex justify-between items-center text-sm font-black">
            <span className="text-white uppercase tracking-wider">Total Tabungan:</span>
            <span className="text-blue-400 text-lg">Rp {new Intl.NumberFormat("id-ID").format(totals.tabungan)}</span>
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
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-lg shadow-blue-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Ya, Simpan Tabungan</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
