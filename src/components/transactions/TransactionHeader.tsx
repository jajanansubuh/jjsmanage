import { Download, Upload, ChevronDown, Check, Scissors } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TransactionHeaderProps {
  isEditMode: boolean;
  editNoteNumber: string | null;
  selectedCashiers: string[];
  setSelectedCashiers: (ids: string[]) => void;
  cashiers: any[];
  onExport: () => void;
  onImportClick: () => void;
}

export function TransactionHeader({
  isEditMode,
  editNoteNumber,
  selectedCashiers,
  setSelectedCashiers,
  cashiers,
  onExport,
  onImportClick
}: TransactionHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="space-y-1 shrink-0">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
          {isEditMode ? "Edit" : "Input"} <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">Transaksi</span>
        </h2>
        <p className="text-slate-400 font-medium">
          {isEditMode ? `Mengubah data transaksi nota ${editNoteNumber}` : "Kelola data penjualan harian mitra Jjs dengan presisi."}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">


        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all shrink-0 whitespace-nowrap">
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


        <Button onClick={onExport} variant="outline" className="h-12 px-5 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95 shadow-xl shrink-0 whitespace-nowrap">
          <Download className="w-4 h-4 mr-2 text-blue-400" /> Excel
        </Button>

        <Button onClick={onImportClick} variant="outline" className="h-12 px-5 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95 shadow-xl shrink-0 whitespace-nowrap">
          <Upload className="w-4 h-4 mr-2 text-emerald-400" /> Import
        </Button>

        <div className="h-12 w-[1px] bg-white/10 mx-2 hidden sm:block shrink-0" />

        <Link href="/potongan/input" className="shrink-0">
          <Button className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 whitespace-nowrap">
            <Scissors size={18} className="shrink-0" />
            Input Potongan
          </Button>
        </Link>
      </div>
    </div>
  );
}
