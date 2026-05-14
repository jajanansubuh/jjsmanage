import { Download, Save, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CetakHeaderProps {
  userRole: string | null;
  isSavingQueue: boolean;
  isExporting: boolean;
  onSaveQueue: () => void;
  onExport: () => void;
  onPrint: () => void;
  hasSelected: boolean;
  hasQueue: boolean;
}

export function CetakHeader({
  userRole,
  isSavingQueue,
  isExporting,
  onSaveQueue,
  onExport,
  onPrint,
  hasSelected,
  hasQueue
}: CetakHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
      <div className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          {userRole === "ADMIN" ? "Cetak" : "Input"} <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Label Harga</span>
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          {userRole === "ADMIN" 
            ? "Cetak label harga dari antrean suplier atau pilih manual." 
            : "Pilih produk dan tentukan jumlah label yang ingin dicetak oleh admin."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {userRole === "SUPPLIER" ? (
          <Button
            onClick={onSaveQueue}
            disabled={isSavingQueue || !hasSelected}
            className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white font-black gap-2 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            {isSavingQueue ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Kirim ke Admin</span>
          </Button>
        ) : (
          <>
            <Button
              onClick={onExport}
              disabled={isExporting || !hasQueue}
              variant="outline"
              className="h-12 px-6 bg-slate-950/50 border-white/5 rounded-2xl hover:bg-white/5 text-white gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isExporting ? "Memproses..." : "Export Excel"}</span>
            </Button>
            <Button
              onClick={onPrint}
              disabled={!hasSelected}
              className="h-12 px-8 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-black gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
              <Printer className="w-5 h-5" />
              <span>Cetak Label</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
