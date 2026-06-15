import { Download, Upload, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductHeaderProps {
  onExport: () => void;
  onImport: () => void;
  onMerge?: () => void;
  isExporting: boolean;
  userRole?: string | null;
}

export function ProductHeader({
  onExport,
  onImport,
  onMerge,
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
            className="h-10 px-4 md:px-5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 hover:text-white text-slate-300 gap-2 transition-all duration-200 rounded-xl text-xs md:text-sm font-semibold shadow-md shadow-black/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>{isExporting ? "..." : "Export"}</span>
          </Button>
          <Button
            className="h-10 px-4 md:px-5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 hover:text-white text-slate-300 gap-2 transition-all duration-200 rounded-xl text-xs md:text-sm font-semibold shadow-md shadow-black/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            onClick={onImport}
          >
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Import</span>
          </Button>
          {onMerge && (
            <Button
              className="h-10 px-4 md:px-5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 hover:text-white text-slate-300 gap-2 transition-all duration-200 rounded-xl text-xs md:text-sm font-semibold shadow-md shadow-black/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              onClick={onMerge}
            >
              <GitMerge className="w-4 h-4 text-amber-400" />
              <span>Gabung Produk</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
