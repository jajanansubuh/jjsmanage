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
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-[180px_180px_1fr_auto] gap-4 items-end">
        <div className="space-y-3 flex flex-col justify-center">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tanggal Transaksi</Label>
          <Popover>
            <PopoverTrigger className={cn("h-10 px-3 rounded-md bg-background border border-border text-foreground font-bold hover:border-primary/50 transition-all shrink-0 flex items-center justify-start w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", !selectedDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
              {selectedDate ? format(new Date(selectedDate), "dd MMM yyyy") : "Pilih Tanggal"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg" align="start">
              <Calendar mode="single" selected={new Date(selectedDate)} onSelect={(d) => d && onDateChange(format(d, "yyyy-MM-dd"))} className="text-foreground" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-3 flex flex-col justify-center">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nomor Nota</Label>
          <Input
            value={noteNumber}
            onChange={(e) => onNoteNumberChange(e.target.value)}
            placeholder="1405202401"
            className="font-bold text-primary"
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
            className="font-medium text-foreground"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            disabled={!hasRows || isSaving}
            onClick={onSave}
            className="flex items-center gap-2 whitespace-nowrap"
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
            className="shrink-0 whitespace-nowrap text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
