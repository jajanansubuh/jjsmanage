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

    // Get session for Role Based Access Control
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    const isSupplier = session?.user?.role === "SUPPLIER";
    const supplierId = session?.user?.supplierId;

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

    const baseWhere: any = { date: dateFilter };
    if (isSupplier && supplierId) {
      baseWhere.supplierId = supplierId;
    }

    // 1. Agregasi Total Revenue & Profit
    const totals = await prisma.consignmentReport.aggregate({
      where: baseWhere,
      _sum: {
        revenue: true,
        profit20: true,
        profit80: true,
        tabungan: true
      }
    });

    const totalRevenue = totals._sum.revenue || 0;
    const totalProfit20 = totals._sum.profit20 || 0;
    const totalProfit80 = totals._sum.profit80 || 0;
    const totalSavings = totals._sum.tabungan || 0;

    // 2. Count Suppliers & Cashiers (Admin Only)
    let totalSuppliers = 0;
    let totalCashiers = 0;
    let totalTransactions = 0;

    if (!isSupplier) {
      totalSuppliers = await prisma.supplier.count();
      totalCashiers = await prisma.cashier.count();
    } else {
      const reports = await prisma.consignmentReport.findMany({
        where: baseWhere,
        select: { id: true, noteNumber: true }
      });
      const uniqueNotes = new Set(reports.map(r => r.noteNumber || r.id));
      totalTransactions = uniqueNotes.size;
    }

    // 3. Top Suppliers (Admin Only)
    let topSuppliers: any[] = [];
    if (!isSupplier) {
      const topSupplierGroups = await prisma.consignmentReport.groupBy({
        by: ['supplierId'],
        where: { date: dateFilter },
        _sum: { revenue: true },
        _count: { id: true },
        orderBy: { _sum: { revenue: 'desc' } },
        take: 5
      });

      const topSupplierIds = topSupplierGroups.map(g => g.supplierId);
      const topSuppliersData = await prisma.supplier.findMany({
        where: { id: { in: topSupplierIds } },
        select: { id: true, name: true }
      });

      // Get unique note counts for each top supplier
      const uniqueNoteCounts = await Promise.all(topSupplierIds.map(async (sid) => {
        const notes = await prisma.consignmentReport.findMany({
          where: { 
            supplierId: sid,
            date: dateFilter 
          },
          select: { id: true, noteNumber: true }
        });
        const uniqueNotes = new Set(notes.map(n => n.noteNumber || n.id));
        return { supplierId: sid, count: uniqueNotes.size };
      }));

      topSuppliers = topSupplierGroups.map(g => {
        const supplier = topSuppliersData.find(s => s.id === g.supplierId);
        const uniqueCount = uniqueNoteCounts.find(u => u.supplierId === g.supplierId)?.count || 0;
        return {
          id: g.supplierId,
          name: supplier?.name || "Unknown",
          totalRevenue: g._sum.revenue || 0,
          transactionCount: uniqueCount
        };
      });
    }

    // 4. Trend Data - Optimization: Only fetch what's needed
    const trendRecords = await prisma.consignmentReport.findMany({
      where: baseWhere,
      select: { date: true, revenue: true, profit80: true },
      orderBy: { date: "asc" }
    });

    let revenueTrend: any[] = [];

    if (period === "day" || (period === "custom" && differenceInDays(endDate, startDate) <= 31)) {
      // Group by day using YYYY-MM-DD for reliable matching
      const dataMap = new Map();
      let curr = new Date(startDate);
      while (curr <= endDate) {
        dataMap.set(format(curr, "yyyy-MM-dd"), 0);
        curr = new Date(curr.getTime() + 24 * 60 * 60 * 1000);
      }
      
      trendRecords.forEach(r => {
        const key = format(new Date(r.date), "yyyy-MM-dd");
        if (dataMap.has(key)) {
          const val = isSupplier ? (r.profit80 || 0) : (r.revenue || 0);
          dataMap.set(key, dataMap.get(key) + val);
        }
      });
      
      revenueTrend = Array.from(dataMap.entries()).map(([dateStr, total]) => ({
        name: format(new Date(dateStr), "dd MMM", { locale: id }),
        total
      }));
    } 
    else if (period === "week") {
      // Group by week
      const weeksMap = new Map();
      let currentWeek = new Date(startDate);
      while (currentWeek <= endDate) {
        const weekKey = `Mg ${format(currentWeek, "w", { locale: id })}`;
        weeksMap.set(weekKey, 0);
        currentWeek = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      trendRecords.forEach(r => {
        const key = `Mg ${format(new Date(r.date), "w", { locale: id })}`;
        if (weeksMap.has(key)) {
          const val = isSupplier ? (r.profit80 || 0) : (r.revenue || 0);
          weeksMap.set(key, weeksMap.get(key) + val);
        }
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
        const key = format(new Date(r.date), "MMM", { locale: id });
        if (monthsMap.has(key)) {
          const val = isSupplier ? (r.profit80 || 0) : (r.revenue || 0);
          monthsMap.set(key, monthsMap.get(key) + val);
        }
      });
      revenueTrend = Array.from(monthsMap.entries()).map(([name, total]) => ({ name, total }));
    }

    // 5. Calculate Previous Period for Comparison
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);

    const prevWhere = {
      ...baseWhere,
      date: {
        gte: prevStartDate,
        lte: prevEndDate,
      }
    };

    const prevTotals = await prisma.consignmentReport.aggregate({
      where: prevWhere,
      _sum: {
        revenue: true,
        profit20: true,
        profit80: true
      }
    });

    const prevRevenue = prevTotals._sum.revenue || 0;
    const prevProfit20 = prevTotals._sum.profit20 || 0;
    const prevProfit80 = prevTotals._sum.profit80 || 0;

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueGrowth = calculateGrowth(totalRevenue, prevRevenue);
    const profit20Growth = calculateGrowth(totalProfit20, prevProfit20);
    const profit80Growth = calculateGrowth(totalProfit80, prevProfit80);

    // Get current balance if supplier
    let currentBalance = 0;
    if (isSupplier && supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        select: { validatedBalance: true }
      });
      currentBalance = supplier?.validatedBalance || 0;
    }

    return NextResponse.json({
      totalRevenue,
      totalProfit20,
      totalProfit80,
      totalSavings,
      currentBalance,
      totalSuppliers,
      totalCashiers,
      totalTransactions,
      revenueTrend,
      topSuppliers,
      revenueGrowth,
      profit20Growth,
      profit80Growth,
      role: session?.user?.role
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
