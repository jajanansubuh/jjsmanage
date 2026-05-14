import { Save, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PotonganFooterProps {
  totals: {
    serviceCharge: number;
    kukuluban: number;
    tabungan: number;
    grandTotal: number;
  };
  onSave: () => void;
  isSaving: boolean;
  hasRows: boolean;
}

export function PotonganFooter({ totals, onSave, isSaving, hasRows }: PotonganFooterProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Total S.Charge</p>
          <p className="text-xl font-black text-white">{new Intl.NumberFormat("id-ID").format(totals.serviceCharge)}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Total Kukuluban</p>
          <p className="text-xl font-black text-white">{new Intl.NumberFormat("id-ID").format(totals.kukuluban)}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl">
          <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Total Tabungan</p>
          <p className="text-xl font-black text-white">{new Intl.NumberFormat("id-ID").format(totals.tabungan)}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-emerald-500/20 shadow-xl bg-emerald-500/5">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Grand Total Pot.</p>
          <p className="text-2xl font-black text-emerald-400">{new Intl.NumberFormat("id-ID").format(totals.grandTotal)}</p>
        </div>
      </div>

      <Button
        disabled={!hasRows || isSaving}
        onClick={onSave}
        className="lg:w-72 h-auto py-8 rounded-[2rem] bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-2xl shadow-rose-900/20 transition-all active:scale-[0.98] disabled:opacity-50 group"
      >
        {isSaving ? (
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xl font-black tracking-tight uppercase">Menyimpan...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              <span className="text-xl font-black tracking-tight uppercase">Simpan Semua</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Update Database <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </Button>
    </div>
  );
}
