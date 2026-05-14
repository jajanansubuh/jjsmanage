import { Box, TrendingUp, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProductStatsProps {
  stats: {
    totalItems: number;
    totalSold: string;
    avgSellRate: string;
  };
}

export function ProductStats({ stats }: ProductStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl md:rounded-[2rem] overflow-hidden group hover:border-blue-500/20 transition-all">
        <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
            <Box className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Varian Produk</p>
            <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stats.totalItems}</h4>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl md:rounded-[2rem] overflow-hidden group hover:border-purple-500/20 transition-all">
        <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Total Terjual</p>
            <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter">
              {Number(stats.totalSold).toLocaleString('id-ID', { maximumFractionDigits: 2 })} 
              <span className="text-sm font-bold text-slate-500 ml-1">Pcs</span>
            </h4>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl md:rounded-[2rem] overflow-hidden group hover:border-emerald-500/20 transition-all">
        <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <LayoutGrid className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Rasio Terjual</p>
            <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stats.avgSellRate}%</h4>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
