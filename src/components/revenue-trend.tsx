"use client";

import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid
} from "recharts";

interface RevenueTrendProps {
  data?: { name: string; total: number }[];
}

export function RevenueTrend({ data }: RevenueTrendProps) {
  const chartData = data && data.length > 0 ? data : [{ name: "Jan", total: 0 }];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#1DB954" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid 
          vertical={false} 
          strokeDasharray="3 3" 
          stroke="#282828" 
          opacity={0.8} 
        />
        <XAxis 
          dataKey="name" 
          stroke="#888888" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#888888" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => {
            if (value === 0) return "Rp0";
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
            return value.toString();
          }}
          width={45}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-xl border border-border bg-popover p-3 shadow-md">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {payload[0].payload.name}
                    </span>
                    <span className="text-sm font-black text-foreground">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0
                      }).format(payload[0].value as number)}
                    </span>
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
          stroke="#1DB954" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorTotal)" 
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
