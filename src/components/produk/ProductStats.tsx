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
      <Card className="rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform">
            <Box className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Varian Produk</p>
            <h4 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">{stats.totalItems}</h4>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform">
            <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Total Terjual</p>
            <h4 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">
              {Number(stats.totalSold).toLocaleString('id-ID', { maximumFractionDigits: 2 })} 
              <span className="text-sm font-bold text-muted-foreground ml-1">Pcs</span>
            </h4>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform">
            <LayoutGrid className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Rasio Terjual</p>
            <h4 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">{stats.avgSellRate}%</h4>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
