import { Download, Upload, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductHeaderProps {
  onExport: () => void;
  onImport: () => void;
  onAdd: () => void;
  isExporting: boolean;
  userRole?: string | null;
}

export function ProductHeader({
  onExport,
  onImport,
  onAdd,
  isExporting,
  userRole
}: ProductHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-4 md:px-0">
      <div className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Katalog <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Produk</span>
        </h2>
        <p className="text-slate-400 text-sm md:text-base font-medium">Ringkasan performa penjualan produk Anda berdasarkan transaksi terbaru.</p>
      </div>

      {userRole !== "SUPPLIER" && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3 no-print">
          <Button
            onClick={onExport}
            disabled={isExporting}
            variant="outline"
            className="h-11 md:h-12 px-4 md:px-6 bg-slate-950/50 border-white/5 rounded-2xl hover:bg-white/5 text-white gap-2 transition-all flex-1 md:flex-none text-xs md:text-sm font-bold"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>{isExporting ? "..." : "Export"}</span>
          </Button>
          <Button
            variant="outline"
            className="h-11 md:h-12 px-4 md:px-6 bg-slate-950/50 border-white/5 rounded-2xl hover:bg-white/5 text-white gap-2 transition-all flex-1 md:flex-none text-xs md:text-sm font-bold"
            onClick={onImport}
          >
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Import</span>
          </Button>
          <Button
            className="h-11 md:h-12 px-4 md:px-6 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white gap-2 transition-all w-full md:w-auto text-xs md:text-sm font-black"
            onClick={onAdd}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Produk</span>
          </Button>
        </div>
      )}
    </div>
  );
}
