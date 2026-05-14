import { Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransactionsFooterProps {
  totals: any;
  noteNumber: string;
  onNoteNumberChange: (val: string) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  isSaving: boolean;
  onSave: () => void;
  isEditMode: boolean;
  hasRows: boolean;
}

export function TransactionsFooter({
  totals,
  noteNumber,
  onNoteNumberChange,
  notes,
  onNotesChange,
  isSaving,
  onSave,
  isEditMode,
  hasRows
}: TransactionsFooterProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch mb-6">
      <div className="flex-1 bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          <div className="space-y-3 flex flex-col justify-center">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nomor Nota</Label>
            <Input
              value={noteNumber}
              onChange={(e) => onNoteNumberChange(e.target.value)}
              placeholder="Contoh: 1405202401"
              className="h-14 bg-white/5 border-white/10 rounded-2xl text-xl font-black text-blue-400 focus:ring-blue-500/20"
              disabled={isEditMode}
            />
            {isEditMode && <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Nomor nota tidak dapat diubah.</p>}
          </div>
          <div className="space-y-3 flex flex-col justify-center">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Catatan Tambahan</Label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Catatan untuk transaksi ini..."
              className="w-full h-14 min-h-[56px] p-4 bg-white/5 border-white/10 rounded-2xl text-white font-medium focus:ring-blue-500/20 resize-none outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/3 flex">
        <Button
          disabled={!hasRows || isSaving}
          onClick={onSave}
          className="w-full h-full min-h-[100px] rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-2xl shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {isSaving ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-black tracking-tight uppercase">Menyimpan...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Save className="w-6 h-6" />
              <span className="text-sm lg:text-lg font-black tracking-tight uppercase text-center leading-tight">
                {isEditMode ? "SIMPAN\nPERUBAHAN" : "SIMPAN\nTRANSAKSI"}
              </span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
