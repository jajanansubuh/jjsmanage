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

    const reports = await prisma.consignmentReport.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        supplier: true
      },
      orderBy: { createdAt: "asc" }
    });

    const totalRevenue = reports.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit20 = reports.reduce((acc, curr) => acc + curr.profit20, 0);
    const totalSuppliers = await prisma.supplier.count();
    const totalCashiers = await prisma.cashier.count();

    // Calculate Top Suppliers
    const supplierStatsMap = new Map();
    reports.forEach(r => {
      const s = r.supplier;
      if (!supplierStatsMap.has(s.id)) {
        supplierStatsMap.set(s.id, {
          id: s.id,
          name: s.name,
          totalRevenue: 0,
          transactionCount: 0
        });
      }
      const stats = supplierStatsMap.get(s.id);
      stats.totalRevenue += r.revenue;
      stats.transactionCount += 1;
    });

    const topSuppliers = Array.from(supplierStatsMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    let revenueTrend: any[] = [];

    if (period === "day" || (period === "custom" && differenceInDays(endDate, startDate) <= 31)) {
      // Group by day
      const daysMap = new Map();
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        daysMap.set(format(currentDate, "dd MMM", { locale: id }), 0);
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
      reports.forEach(r => {
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
      reports.forEach(r => {
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
      reports.forEach(r => {
        const key = format(new Date(r.createdAt), "MMM", { locale: id });
        if (monthsMap.has(key)) monthsMap.set(key, monthsMap.get(key) + r.revenue);
      });
      revenueTrend = Array.from(monthsMap.entries()).map(([name, total]) => ({ name, total }));
    }

    // Calculate Previous Period for Comparison
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);

    const prevReports = await prisma.consignmentReport.findMany({
      where: {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        }
      }
    });

    const prevRevenue = prevReports.reduce((acc, curr) => acc + curr.revenue, 0);
    const prevProfit20 = prevReports.reduce((acc, curr) => acc + curr.profit20, 0);

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
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
