import { Save, Loader2, AlertCircle, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  selectedDate: string;
  onDateChange: (date: string) => void;
  onClearAll: () => void;
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
  hasRows,
  selectedDate,
  onDateChange,
  onClearAll
}: TransactionsFooterProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl mb-6">
      <div className="grid grid-cols-1 md:grid-cols-[180px_180px_1fr_auto] gap-4 items-end">
        <div className="space-y-3 flex flex-col justify-center">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tanggal Transaksi</Label>
          <Popover>
            <PopoverTrigger className={cn("h-12 px-3 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all shrink-0 flex items-center justify-start w-full border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20", !selectedDate && "text-slate-500")}>
              <CalendarIcon className="mr-2 h-4 w-4 text-blue-400 shrink-0" />
              {selectedDate ? format(new Date(selectedDate), "dd MMM yyyy") : "Pilih Tanggal"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="start">
              <Calendar mode="single" selected={new Date(selectedDate)} onSelect={(d) => d && onDateChange(format(d, "yyyy-MM-dd"))} className="text-white" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-3 flex flex-col justify-center">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nomor Nota</Label>
          <Input
            value={noteNumber}
            onChange={(e) => onNoteNumberChange(e.target.value)}
            placeholder="1405202401"
            className="h-12 bg-white/5 border-white/10 rounded-2xl text-base font-black text-blue-400 focus:ring-blue-500/20"
            disabled={isEditMode}
          />
          {isEditMode && <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Tidak dapat diubah.</p>}
        </div>
        <div className="space-y-3 flex flex-col justify-center">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Catatan Tambahan</Label>
          <Input
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Catatan untuk transaksi ini..."
            className="h-12 bg-white/5 border-white/10 rounded-2xl text-sm text-white font-medium focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            disabled={!hasRows || isSaving}
            onClick={onSave}
            className="h-12 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center gap-2 whitespace-nowrap"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 shrink-0" />
                {isEditMode ? "Simpan Perubahan" : "Simpan Transaksi"}
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onClearAll}
            disabled={!hasRows}
            className="h-12 px-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
