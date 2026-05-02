"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RevenueTrend } from "@/components/revenue-trend";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";


export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const [stats, setStats] = useState<{
    totalRevenue: number,
    totalProfit20: number,
    totalSuppliers: number,
    totalCashiers: number,
    revenueTrend: any[],
    topSuppliers: any[],
    revenueGrowth: number,
    profit20Growth: number
  }>({
    totalRevenue: 0,
    totalProfit20: 0,
    totalSuppliers: 0,
    totalCashiers: 0,
    revenueTrend: [],
    topSuppliers: [],
    revenueGrowth: 0,
    profit20Growth: 0
  });
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("M"); // D, W, M, Y

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const periodMap: Record<string, string> = {
        'D': 'day',
        'W': 'week',
        'M': 'year',
        'Y': 'year' // For now Y and M both use year but could be extended
      };

      const params = new URLSearchParams({ 
        period: (startDate || endDate) ? "custom" : periodMap[selectedPeriod] || "year" 
      });
      
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    }

    fetchData();
  }, [startDate, endDate, selectedPeriod]);

  const cards = [
    {
      title: "Total Pendapatan",
      value: isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats.totalRevenue) : "Rp 0",
      icon: DollarSign,
      trend: `${(stats.revenueGrowth || 0) >= 0 ? "+" : ""}${(stats.revenueGrowth || 0).toFixed(1)}%`,
      trendUp: (stats.revenueGrowth || 0) >= 0,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Laba Bersih 20%",
      value: isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats.totalProfit20) : "Rp 0",
      icon: Wallet,
      trend: `${(stats.profit20Growth || 0) >= 0 ? "+" : ""}${(stats.profit20Growth || 0).toFixed(1)}%`,
      trendUp: (stats.profit20Growth || 0) >= 0,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Total Suplier",
      value: stats.totalSuppliers,
      icon: Users,
      trend: "Aktif",
      trendUp: true,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      title: "Total Kasir",
      value: stats.totalCashiers,
      icon: Users,
      trend: "Terdaftar",
      trendUp: true,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out relative pb-10">
      {/* Subtle background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Ringkasan <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Statistik</span>
          </h2>
          <p className="text-slate-400 font-medium">Performa bisnis Anda dalam genggaman.</p>
        </div>

        <div className="flex items-center gap-3 p-1.5 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors">Dari</span>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "flex items-center justify-start text-left bg-transparent border-0 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto min-w-[90px]",
                      !startDate && "text-slate-500"
                    )}
                  >
                    {startDate ? format(new Date(startDate), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl rounded-2xl" align="end">
                    <Calendar
                      mode="single"
                      selected={startDate ? new Date(startDate) : undefined}
                      onSelect={(date: Date | undefined) => date && setStartDate(format(date, "yyyy-MM-dd"))}
                      initialFocus
                      className="text-white p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 mx-1" />

            <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-400 transition-colors">Hingga</span>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "flex items-center justify-start text-left bg-transparent border-0 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto min-w-[90px]",
                      !endDate && "text-slate-500"
                    )}
                  >
                    {endDate ? format(new Date(endDate), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl rounded-2xl" align="end">
                    <Calendar
                      mode="single"
                      selected={endDate ? new Date(endDate) : undefined}
                      onSelect={(date: Date | undefined) => date && setEndDate(format(date, "yyyy-MM-dd"))}
                      initialFocus
                      className="text-white p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {cards.map((card, index) => (
          <Card
            key={card.title}
            className="group overflow-hidden border-white/5 bg-slate-900/40 backdrop-blur-xl hover:bg-slate-900/60 transition-all duration-500 rounded-3xl shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors">{card.title}</CardTitle>
              <div className={cn("p-2.5 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner", card.bg)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white tracking-tight group-hover:scale-[1.02] transition-transform origin-left">{card.value}</div>
              <div className="flex items-center mt-3 text-xs font-bold">
                <div className={cn(
                  "flex items-center px-2 py-1 rounded-full mr-2",
                  card.trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {card.trendUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                  )}
                  {card.trend}
                </div>
                <span className="text-slate-500">vs bulan lalu</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 relative z-10">
        <Card className="lg:col-span-4 border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Tren Pendapatan
              </CardTitle>
              <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-lg border border-white/5">
                {['D', 'W', 'M', 'Y'].map((t) => (
                  <button 
                    key={t} 
                    onClick={() => {
                      setSelectedPeriod(t);
                      setStartDate("");
                      setEndDate("");
                    }}
                    className={cn(
                      "text-[10px] font-black px-2 py-1 rounded transition-colors",
                      t === selectedPeriod ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-4">
            <RevenueTrend data={stats.revenueTrend} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Pendapatan tertinggi
              </CardTitle>
              <Link 
                href="/master" 
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }), 
                  "h-8 rounded-lg text-blue-400 hover:bg-blue-400/10 font-bold text-[10px] uppercase tracking-widest px-3 border border-blue-400/20 transition-all flex items-center justify-center"
                )}
              >
                Data Suplier
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {stats.topSuppliers && stats.topSuppliers.length > 0 ? (
                stats.topSuppliers.map((s, index) => (
                  <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.transactionCount} Transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumSignificantDigits: 3 }).format(s.totalRevenue)}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-bold">Terpopuler</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500 font-medium">Belum ada data suplier untuk periode ini.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
