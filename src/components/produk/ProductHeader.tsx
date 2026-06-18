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
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Katalog Produk
        </h2>
        <p className="text-muted-foreground text-sm md:text-base font-medium">Ringkasan performa penjualan produk Anda berdasarkan transaksi terbaru.</p>
      </div>

      {userRole !== "SUPPLIER" && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3 no-print">
          <Button
            onClick={onExport}
            disabled={isExporting}
            variant="outline"
            className="shrink-0 whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>{isExporting ? "..." : "Export"}</span>
          </Button>
          <Button
            variant="outline"
            className="shrink-0 whitespace-nowrap"
            onClick={onImport}
          >
            <Upload className="w-4 h-4 mr-2" />
            <span>Import</span>
          </Button>
          {onMerge && (
            <Button
              variant="outline"
              className="shrink-0 whitespace-nowrap"
              onClick={onMerge}
            >
              <GitMerge className="w-4 h-4 mr-2" />
              <span>Gabung Produk</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
