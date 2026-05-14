import { FileText, TrendingUp, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PayoutsStatsProps {
  totalTransactions: number;
  totalRevenue: number;
  totalProfit80: number;
}

export function PayoutsStats({
  totalTransactions,
  totalRevenue,
  totalProfit80
}: PayoutsStatsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 px-4 md:px-0">
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden group">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-400/10 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Transaksi</p>
            <p className="text-xl md:text-2xl font-black text-white">{totalTransactions}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden group">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-400/10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Omzet</p>
            <p className="text-xl md:text-2xl font-black text-white">{formatCurrency(totalRevenue)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden group">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-400/10 group-hover:scale-110 transition-transform">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Mitra Jjs</p>
            <p className="text-xl md:text-2xl font-black text-emerald-400">{formatCurrency(totalProfit80)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
