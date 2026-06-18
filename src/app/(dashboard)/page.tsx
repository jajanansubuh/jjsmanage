"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  History,
  Coins
} from "lucide-react";
import { PayoutHistoryModal } from "@/components/payout-history-modal";
import { DashboardCards, DashboardCardProps } from "@/components/dashboard/DashboardCards";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { TopSuppliersList } from "@/components/dashboard/TopSuppliersList";
import { RevenueChartCard } from "@/components/dashboard/RevenueChartCard";


export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const [stats, setStats] = useState<{
    totalRevenue: number,
    totalProfit20: number,
    totalProfit80: number,
    currentBalance: number,
    totalSuppliers: number,
    totalCashiers: number,
    totalTransactions: number,
    revenueTrend: any[],
    topSuppliers: any[],
    revenueGrowth: number,
    profit20Growth: number,
    profit80Growth: number,
    totalSavings: number,
    role?: string
  }>({
    totalRevenue: 0,
    totalProfit20: 0,
    totalProfit80: 0,
    currentBalance: 0,
    totalSuppliers: 0,
    totalCashiers: 0,
    totalTransactions: 0,
    revenueTrend: [],
    topSuppliers: [],
    revenueGrowth: 0,
    profit20Growth: 0,
    profit80Growth: 0,
    totalSavings: 0
  });
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("M"); // D, W, M, Y

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();

  useEffect(() => {
    // We now allow Suppliers to see the Dashboard so they can view their Tabungan stats card.
    // if (isMounted && stats.role === "SUPPLIER") {
    //   router.push("/payouts");
    // }
  }, [isMounted, stats.role, router]);

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
        
        // If supplier, data.role is checked in fetchData but we don't need to fetch payouts here anymore
        // as the PayoutHistoryModal handles its own fetching when opened.
      }
    }

    fetchData();
  }, [startDate, endDate, selectedPeriod]);

  const isSupplier = stats.role === "SUPPLIER";

  const cards: DashboardCardProps[] = isSupplier ? [
    {
      title: "Omzet Penjualan",
      value: isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats.totalRevenue) : "Rp 0",
      icon: DollarSign,
      trend: `${(stats.revenueGrowth || 0) >= 0 ? "+" : ""}${(stats.revenueGrowth || 0).toFixed(1)}%`,
      trendUp: (stats.revenueGrowth || 0) >= 0,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      title: "Mitra Jjs",
      value: isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats.totalProfit80) : "Rp 0",
      icon: Wallet,
      trend: `${(stats.profit80Growth || 0) >= 0 ? "+" : ""}${(stats.profit80Growth || 0).toFixed(1)}%`,
      trendUp: (stats.profit80Growth || 0) >= 0,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    {
      title: "Total Tabungan",
      value: isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats.totalSavings) : "Rp 0",
      icon: Coins,
      trend: "Lihat Detail",
      trendUp: true,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      onClick: () => router.push("/savings")
    },
    {
      title: "Saldo Saat Ini",
      value: isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats.currentBalance) : "Rp 0",
      icon: History,
      trend: "Lihat Riwayat",
      trendUp: true,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      onClick: () => setIsPayoutModalOpen(true)
    }
  ] : [
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
      title: "Toko",
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

  const getPeriodLabel = () => {
    if (startDate || endDate) return "vs periode sebelumnya";
    switch (selectedPeriod) {
      case "D":
        return "vs kemarin";
      case "W":
        return "vs minggu lalu";
      case "M":
        return "vs bulan lalu";
      case "Y":
        return "vs tahun lalu";
      default:
        return "vs bulan lalu";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out relative pb-10 overflow-x-hidden">
      {/* Payout History Modal */}
      <PayoutHistoryModal 
        isOpen={isPayoutModalOpen} 
        onOpenChange={setIsPayoutModalOpen} 
      />

      {/* Remove decorative background for cleaner enterprise look */}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10 px-4 md:px-0">
        <div className="space-y-2 pt-8 md:pt-0">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Ringkasan Statistik
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium opacity-80">Performa bisnis Anda dalam genggaman.</p>
        </div>

        <DateRangeFilter 
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
      </div>

      <DashboardCards cards={cards} periodLabel={getPeriodLabel()} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 relative z-10">
        <RevenueChartCard
          isSupplier={isSupplier}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          revenueTrend={stats.revenueTrend}
        />
        {!isSupplier && (
          <TopSuppliersList topSuppliers={stats.topSuppliers} />
        )}
      </div>
    </div>
  );
}
