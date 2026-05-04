import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format, subDays, startOfWeek, subWeeks, startOfYear, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "year"; // day, week, year, custom
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate = new Date();

    if (period === "day") {
      startDate = subDays(new Date(), 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate = subWeeks(new Date(), 3);
      startDate = startOfWeek(startDate, { weekStartsOn: 1 });
    } else if (period === "year") {
      startDate = startOfYear(new Date());
    } else if (period === "custom" && startParam && endParam) {
      startDate = new Date(startParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = startOfYear(new Date()); // fallback
    }

    const dateFilter = {
      gte: startDate,
      lte: endDate,
    };

    // 1. Agregasi Total Revenue & Profit
    const totals = await prisma.consignmentReport.aggregate({
      where: { createdAt: dateFilter },
      _sum: {
        revenue: true,
        profit20: true
      }
    });

    const totalRevenue = totals._sum.revenue || 0;
    const totalProfit20 = totals._sum.profit20 || 0;

    // 2. Count Suppliers & Cashiers
    const totalSuppliers = await prisma.supplier.count();
    const totalCashiers = await prisma.cashier.count();

    // 3. Top Suppliers dengan groupBy
    const topSupplierGroups = await prisma.consignmentReport.groupBy({
      by: ['supplierId'],
      where: { createdAt: dateFilter },
      _sum: { revenue: true },
      _count: { id: true },
      orderBy: { _sum: { revenue: 'desc' } },
      take: 5
    });

    // Ambil nama supplier untuk top 5
    const topSupplierIds = topSupplierGroups.map(g => g.supplierId);
    const topSuppliersData = await prisma.supplier.findMany({
      where: { id: { in: topSupplierIds } },
      select: { id: true, name: true }
    });

    const topSuppliers = topSupplierGroups.map(g => {
      const supplier = topSuppliersData.find(s => s.id === g.supplierId);
      return {
        id: g.supplierId,
        name: supplier?.name || "Unknown",
        totalRevenue: g._sum.revenue || 0,
        transactionCount: g._count.id || 0
      };
    });

    // 4. Trend Data - Hanya mengambil kolom yang diperlukan untuk menghemat memory
    const trendRecords = await prisma.consignmentReport.findMany({
      where: { createdAt: dateFilter },
      select: { createdAt: true, revenue: true },
      orderBy: { createdAt: "asc" }
    });

    let revenueTrend: any[] = [];

    if (period === "day" || (period === "custom" && differenceInDays(endDate, startDate) <= 31)) {
      // Group by day
      const daysMap = new Map();
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        daysMap.set(format(currentDate, "dd MMM", { locale: id }), 0);
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
      trendRecords.forEach(r => {
        const key = format(new Date(r.createdAt), "dd MMM", { locale: id });
        if (daysMap.has(key)) daysMap.set(key, daysMap.get(key) + r.revenue);
      });
      revenueTrend = Array.from(daysMap.entries()).map(([name, total]) => ({ name, total }));
    } 
    else if (period === "week") {
      // Group by week
      const weeksMap = new Map();
      let currentWeek = new Date(startDate);
      while (currentWeek <= endDate) {
        const weekKey = `Mg ${format(currentWeek, "w", { locale: id })}`; // e.g. Mg 12
        weeksMap.set(weekKey, 0);
        currentWeek = new Date(currentWeek.setDate(currentWeek.getDate() + 7));
      }
      trendRecords.forEach(r => {
        const key = `Mg ${format(new Date(r.createdAt), "w", { locale: id })}`;
        if (weeksMap.has(key)) weeksMap.set(key, weeksMap.get(key) + r.revenue);
      });
      revenueTrend = Array.from(weeksMap.entries()).map(([name, total]) => ({ name, total }));
    }
    else {
      // Group by month
      const monthsMap = new Map();
      let currentMonthDate = new Date(startDate);
      while (currentMonthDate <= endDate) {
        const monthKey = format(currentMonthDate, "MMM", { locale: id });
        monthsMap.set(monthKey, 0);
        currentMonthDate = new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() + 1));
      }
      trendRecords.forEach(r => {
        const key = format(new Date(r.createdAt), "MMM", { locale: id });
        if (monthsMap.has(key)) monthsMap.set(key, monthsMap.get(key) + r.revenue);
      });
      revenueTrend = Array.from(monthsMap.entries()).map(([name, total]) => ({ name, total }));
    }

    // 5. Calculate Previous Period for Comparison using aggregation
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);

    const prevTotals = await prisma.consignmentReport.aggregate({
      where: {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        }
      },
      _sum: {
        revenue: true,
        profit20: true
      }
    });

    const prevRevenue = prevTotals._sum.revenue || 0;
    const prevProfit20 = prevTotals._sum.profit20 || 0;

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueGrowth = calculateGrowth(totalRevenue, prevRevenue);
    const profit20Growth = calculateGrowth(totalProfit20, prevProfit20);

    return NextResponse.json({
      totalRevenue,
      totalProfit20,
      totalSuppliers,
      totalCashiers,
      revenueTrend,
      topSuppliers,
      revenueGrowth,
      profit20Growth
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
