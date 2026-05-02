"use client";

import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";

interface RevenueTrendProps {
  data?: { name: string; total: number }[];
}

export function RevenueTrend({ data }: RevenueTrendProps) {
  const chartData = data && data.length > 0 ? data : [{ name: "Jan", total: 0 }];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="name" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="#888888" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => {
            if (value === 0) return "Rp0jt";
            return `Rp${value / 1000000}jt`;
          }}
          domain={[0, (dataMax: number) => Math.max(dataMax, 50000000)]}
          ticks={[0, 10000000, 15000000, 20000000, 50000000]}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Bulan
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {payload[0].payload.name}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Total
                      </span>
                      <span className="font-bold">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(payload[0].value as number)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke="#3b82f6" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorTotal)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
