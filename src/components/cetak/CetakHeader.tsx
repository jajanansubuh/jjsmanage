import { Download, Save, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CetakHeaderProps {
  userRole: string | null;
  isSavingQueue: boolean;
  isExporting: boolean;
  onSaveQueue: () => void;
  onExport: () => void;
  hasSelected: boolean;
  hasQueue: boolean;
}

export function CetakHeader({
  userRole,
  isSavingQueue,
  isExporting,
  onSaveQueue,
  onExport,
  hasSelected,
  hasQueue
}: CetakHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
      <div className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
          {userRole === "ADMIN" ? "Kelola Label Harga" : "Input Label Harga"}
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          {userRole === "ADMIN" 
            ? "Kelola antrean label dari suplier dan lihat riwayat cetak." 
            : "Pilih produk dan tentukan jumlah label yang ingin dicetak oleh admin."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {userRole === "SUPPLIER" ? (
          <Button
            onClick={onSaveQueue}
            disabled={isSavingQueue || !hasSelected}
            className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-white font-black gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSavingQueue ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Kirim ke Admin</span>
          </Button>
        ) : (
          <>
            <Button
              onClick={() => document.getElementById("admin-print-history")?.scrollIntoView({ behavior: "smooth" })}
              variant="outline"
              className="h-12 px-6 bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-white/5 text-white gap-2 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>Riwayat</span>
            </Button>
            <Button
              onClick={onExport}
              disabled={isExporting || !hasQueue}
              className="h-12 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-white font-black gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? "Memproses..." : "Export Excel"}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
