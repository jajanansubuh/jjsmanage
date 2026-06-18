import { Download, Upload, ChevronDown, Check, Scissors } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
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
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          {isEditMode ? "Edit" : "Input"} Transaksi
        </h2>
        <p className="text-muted-foreground font-medium">
          {isEditMode ? `Mengubah data transaksi nota ${editNoteNumber}` : "Kelola data penjualan harian mitra Jjs dengan presisi."}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">


        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: "outline", className: "shrink-0 whitespace-nowrap" })}>
            Kasir ({selectedCashiers.length}) <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-popover border-border p-2 shadow-lg" align="end">
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
                className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent transition-all group"
              >
                <span className={cn("text-sm font-bold transition-colors", selectedCashiers.includes(cashier.id) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                  {cashier.name}
                </span>
                {selectedCashiers.includes(cashier.id) && <Check className="h-4 w-4 text-primary" />}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>


        <Button onClick={onExport} variant="outline" className="shrink-0 whitespace-nowrap">
          <Download className="w-4 h-4 mr-2" /> Excel
        </Button>

        <Button onClick={onImportClick} variant="outline" className="shrink-0 whitespace-nowrap">
          <Upload className="w-4 h-4 mr-2" /> Import
        </Button>

        <div className="h-10 w-[1px] bg-border mx-2 hidden sm:block shrink-0" />

        <Link href="/potongan/input" className="shrink-0">
          <Button className="shrink-0 whitespace-nowrap">
            <Scissors size={16} className="mr-2" />
            Input Potongan
          </Button>
        </Link>
      </div>
    </div>
  );
}
