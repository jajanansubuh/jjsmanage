import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportsHeaderProps {
  onExport: () => void;
}

export function ReportsHeader({ onExport }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Arsip <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">JjsManage</span>
        </h2>
        <p className="text-slate-400 font-medium text-sm md:text-base">Riwayat lengkap transaksi harian, setoran tunai, dan akumulasi tabungan mitra.</p>
      </div>
      <div className="shrink-0">
        <Button onClick={onExport} className="h-12 w-full sm:w-auto px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 shadow-xl transition-all active:scale-95">
          <Download className="w-5 h-5 mr-2 text-blue-400" /> Export Excel
        </Button>
      </div>
    </div>
  );
}
