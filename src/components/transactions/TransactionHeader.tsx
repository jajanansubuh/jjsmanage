import { Download, Upload, Trash2, ChevronDown, Check, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TransactionHeaderProps {
  isEditMode: boolean;
  editNoteNumber: string | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedCashiers: string[];
  setSelectedCashiers: (ids: string[]) => void;
  cashiers: any[];
  onExport: () => void;
  onImportClick: () => void;
  onClearAll: () => void;
  hasRows: boolean;
}

export function TransactionHeader({
  isEditMode,
  editNoteNumber,
  selectedDate,
  onDateChange,
  selectedCashiers,
  setSelectedCashiers,
  cashiers,
  onExport,
  onImportClick,
  onClearAll,
  hasRows
}: TransactionHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
          {isEditMode ? "Edit" : "Input"} <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">Transaksi</span>
        </h2>
        <p className="text-slate-400 font-medium">
          {isEditMode ? `Mengubah data transaksi nota ${editNoteNumber}` : "Kelola data penjualan harian mitra Jjs dengan presisi."}
        </p>
      </div>

      <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-3 w-full lg:w-auto lg:justify-end">
        <Popover>
          <PopoverTrigger render={
            <Button variant="outline" className={cn("h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all", !selectedDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4 text-blue-400" />
              {selectedDate ? format(new Date(selectedDate), "dd MMMM yyyy") : "Pilih Tanggal"}
            </Button>
          } />
          <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="end">
            <Calendar mode="single" selected={new Date(selectedDate)} onSelect={(d) => d && onDateChange(format(d, "yyyy-MM-dd"))} className="text-white" />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all">
              Kasir ({selectedCashiers.length}) <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          } />
          <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-white/10 p-2 shadow-2xl" align="end">
            <div className="p-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Pilih Kasir</div>
            {cashiers.map((cashier) => (
              <div
                key={cashier.id}
                onClick={() => {
                  const current = [...selectedCashiers];
                  const index = current.indexOf(cashier.id);
                  if (index > -1) current.splice(index, 1);
                  else current.push(cashier.id);
                  setSelectedCashiers(current);
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all group"
              >
                <span className={cn("text-sm font-bold transition-colors", selectedCashiers.includes(cashier.id) ? "text-blue-400" : "text-slate-400 group-hover:text-white")}>
                  {cashier.name}
                </span>
                {selectedCashiers.includes(cashier.id) && <Check className="h-4 w-4 text-blue-400" />}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" onClick={onClearAll} disabled={!hasRows} className="h-12 px-5 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
          <Trash2 className="w-4 h-4 mr-2" /> Reset
        </Button>

        <div className="h-12 w-[1px] bg-white/10 mx-2 hidden sm:block" />

        <Button onClick={onExport} variant="outline" className="h-12 px-5 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95 shadow-xl">
          <Download className="w-4 h-4 mr-2 text-blue-400" /> Excel
        </Button>

        <Button onClick={onImportClick} variant="outline" className="h-12 px-5 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95 shadow-xl">
          <Upload className="w-4 h-4 mr-2 text-emerald-400" /> Import
        </Button>
      </div>
    </div>
  );
}
