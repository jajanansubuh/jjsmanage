import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { RevenueTrend } from "@/components/revenue-trend";

export function RevenueChartCard({
  isSupplier,
  selectedPeriod,
  setSelectedPeriod,
  setStartDate,
  setEndDate,
  revenueTrend
}: {
  isSupplier: boolean;
  selectedPeriod: string;
  setSelectedPeriod: (val: string) => void;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  revenueTrend: any[];
}) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader className="border-b border-border bg-muted/30 py-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {isSupplier ? "Tren Mitra Jjs" : "Tren Pendapatan"}
          </CardTitle>
          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border shadow-sm">
            {['D', 'W', 'M', 'Y'].map((t) => (
              <button 
                key={t} 
                onClick={() => {
                  setSelectedPeriod(t);
                  setStartDate("");
                  setEndDate("");
                }}
                className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded transition-colors",
                  t === selectedPeriod ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8 pb-4">
        <RevenueTrend data={revenueTrend} />
      </CardContent>
    </Card>
  );
}
