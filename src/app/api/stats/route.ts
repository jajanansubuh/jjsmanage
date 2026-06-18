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

    let referenceDate = new Date();
    const latestReport = await prisma.consignmentReport.findFirst({
      where: isSupplier && supplierId ? { supplierId } : {},
      orderBy: { date: "desc" },
      select: { date: true }
    });
    if (latestReport && latestReport.date) {
      referenceDate = new Date(latestReport.date);
    }

    let startDate: Date;
    let endDate = new Date(referenceDate);
    if (period !== "custom") {
      endDate.setHours(23, 59, 59, 999);
    }

    if (period === "day") {
      startDate = subDays(referenceDate, 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate = subWeeks(referenceDate, 3);
      startDate = startOfWeek(startDate, { weekStartsOn: 1 });
    } else if (period === "year") {
      startDate = startOfYear(referenceDate);
    } else if (period === "custom" && startParam && endParam) {
      startDate = new Date(startParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = startOfYear(referenceDate); // fallback
    }

    let cardStartDate = startDate;
    let cardEndDate = endDate;

    if (period === "day") {
      const targetDayStart = new Date(referenceDate);
      targetDayStart.setHours(0, 0, 0, 0);
      const targetDayEnd = new Date(referenceDate);
      targetDayEnd.setHours(23, 59, 59, 999);

      cardStartDate = targetDayStart;
      cardEndDate = targetDayEnd;
    }

    const dateFilter = {
      gte: startDate,
      lte: endDate,
    };

    const baseWhere: any = { date: dateFilter };
    if (isSupplier && supplierId) {
      baseWhere.supplierId = supplierId;
    }

    const cardWhere: any = {
      ...baseWhere,
      date: {
        gte: cardStartDate,
        lte: cardEndDate
      }
    };

    // 1. Agregasi Total Revenue & Profit
    const totals = await prisma.consignmentReport.aggregate({
      where: cardWhere,
      _sum: {
        revenue: true,
        profit20: true,
        profit80: true,
        tabungan: true
      }
    });

    const totalRevenue = Number(totals._sum.revenue || 0);
    const totalProfit20 = Number(totals._sum.profit20 || 0);
    const totalProfit80 = Number(totals._sum.profit80 || 0);
    const totalSavings = Number(totals._sum.tabungan || 0);

    // 2. Count Suppliers & Cashiers (Admin Only)
    let totalSuppliers = 0;
    let totalCashiers = 0;
    let totalTransactions = 0;

    if (!isSupplier) {
      totalSuppliers = await prisma.supplier.count();
      totalCashiers = await prisma.cashier.count();
    } else {
      const reports = await prisma.consignmentReport.findMany({
        where: cardWhere,
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

      // Get unique note counts in a single batch query instead of N+1
      const notes = await prisma.consignmentReport.findMany({
        where: { 
          supplierId: { in: topSupplierIds },
          date: dateFilter 
        },
        select: { id: true, noteNumber: true, supplierId: true }
      });
      
      const supplierNotesMap = new Map<string, Set<string>>();
      topSupplierIds.forEach(sid => supplierNotesMap.set(sid, new Set()));
      
      notes.forEach(n => {
        const set = supplierNotesMap.get(n.supplierId);
        if (set) {
          set.add(n.noteNumber || n.id);
        }
      });
      
      const uniqueNoteCounts = topSupplierIds.map(sid => ({
        supplierId: sid,
        count: supplierNotesMap.get(sid)?.size || 0
      }));

      topSuppliers = topSupplierGroups.map(g => {
        const supplier = topSuppliersData.find(s => s.id === g.supplierId);
        const uniqueCount = uniqueNoteCounts.find(u => u.supplierId === g.supplierId)?.count || 0;
        return {
          id: g.supplierId,
          name: supplier?.name || "Unknown",
          totalRevenue: Number(g._sum.revenue || 0),
          transactionCount: uniqueCount
        };
      });
    }

    // 4. Trend Data - Optimization: Query aggregated buckets directly from DB
    const sqlSupplierId = isSupplier && supplierId ? supplierId : null;
    let revenueTrend: any[] = [];

    if (period === "day" || (period === "custom" && differenceInDays(endDate, startDate) <= 31)) {
      const trendData = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE_TRUNC('day', date) AS bucket,
          SUM(revenue)::double precision AS revenue,
          SUM(profit80)::double precision AS profit80
        FROM "ConsignmentReport"
        WHERE date >= ${startDate} AND date <= ${endDate}
          AND (${sqlSupplierId}::text IS NULL OR "supplierId" = ${sqlSupplierId})
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      
      const dataMap = new Map();
      let curr = new Date(startDate);
      while (curr <= endDate) {
        dataMap.set(format(curr, "yyyy-MM-dd"), 0);
        curr = new Date(curr.getTime() + 24 * 60 * 60 * 1000);
      }
      
      trendData.forEach(row => {
        const key = format(new Date(row.bucket), "yyyy-MM-dd");
        const val = isSupplier ? Number(row.profit80 || 0) : Number(row.revenue || 0);
        if (dataMap.has(key)) {
          dataMap.set(key, val);
        }
      });
      
      revenueTrend = Array.from(dataMap.entries()).map(([dateStr, total]) => ({
        name: format(new Date(dateStr), "dd MMM", { locale: id }),
        total
      }));
    } 
    else if (period === "week") {
      const trendData = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE_TRUNC('week', date) AS bucket,
          SUM(revenue)::double precision AS revenue,
          SUM(profit80)::double precision AS profit80
        FROM "ConsignmentReport"
        WHERE date >= ${startDate} AND date <= ${endDate}
          AND (${sqlSupplierId}::text IS NULL OR "supplierId" = ${sqlSupplierId})
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      
      const weeksMap = new Map();
      let currentWeek = new Date(startDate);
      while (currentWeek <= endDate) {
        const weekKey = `Mg ${format(currentWeek, "w", { locale: id })}`;
        weeksMap.set(weekKey, 0);
        currentWeek = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      
      trendData.forEach(row => {
        const key = `Mg ${format(new Date(row.bucket), "w", { locale: id })}`;
        const val = isSupplier ? Number(row.profit80 || 0) : Number(row.revenue || 0);
        if (weeksMap.has(key)) {
          weeksMap.set(key, val);
        }
      });
      
      revenueTrend = Array.from(weeksMap.entries()).map(([name, total]) => ({ name, total }));
    }
    else {
      const trendData = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE_TRUNC('month', date) AS bucket,
          SUM(revenue)::double precision AS revenue,
          SUM(profit80)::double precision AS profit80
        FROM "ConsignmentReport"
        WHERE date >= ${startDate} AND date <= ${endDate}
          AND (${sqlSupplierId}::text IS NULL OR "supplierId" = ${sqlSupplierId})
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      
      const monthsMap = new Map();
      let currentMonthDate = new Date(startDate);
      while (currentMonthDate <= endDate) {
        const monthKey = format(currentMonthDate, "MMM", { locale: id });
        monthsMap.set(monthKey, 0);
        currentMonthDate = new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() + 1));
      }
      
      trendData.forEach(row => {
        const key = format(new Date(row.bucket), "MMM", { locale: id });
        const val = isSupplier ? Number(row.profit80 || 0) : Number(row.revenue || 0);
        if (monthsMap.has(key)) {
          monthsMap.set(key, val);
        }
      });
      
      revenueTrend = Array.from(monthsMap.entries()).map(([name, total]) => ({ name, total }));
    }

    // 5. Calculate Previous Period for Comparison
    let prevCardStartDate: Date;
    let prevCardEndDate: Date;

    if (period === "day") {
      prevCardStartDate = subDays(cardStartDate, 1);
      prevCardEndDate = new Date(prevCardStartDate);
      prevCardEndDate.setHours(23, 59, 59, 999);
    } else {
      const duration = endDate.getTime() - startDate.getTime();
      prevCardEndDate = new Date(startDate.getTime() - 1);
      prevCardStartDate = new Date(prevCardEndDate.getTime() - duration);
    }

    const prevWhere = {
      ...baseWhere,
      date: {
        gte: prevCardStartDate,
        lte: prevCardEndDate,
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

    const prevRevenue = Number(prevTotals._sum.revenue || 0);
    const prevProfit20 = Number(prevTotals._sum.profit20 || 0);
    const prevProfit80 = Number(prevTotals._sum.profit80 || 0);

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
      currentBalance = Number(supplier?.validatedBalance || 0);
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
