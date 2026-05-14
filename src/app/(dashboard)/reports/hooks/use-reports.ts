import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export function useReports() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [savingsSearch, setSavingsSearch] = useState("");
  const [deductionSearch, setDeductionSearch] = useState("");
  const [produkSearch, setProdukSearch] = useState("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, statsRes, payoutsRes, savingsRes] = await Promise.all([
        fetch("/api/reports?limit=2000"),
        fetch("/api/stats"),
        fetch("/api/payouts"),
        fetch("/api/savings")
      ]);

      const reportsData = await reportsRes.json();
      const statsData = await statsRes.json();
      const payoutsData = await payoutsRes.json();
      const savingsData = await savingsRes.json();

      setReports(Array.isArray(reportsData) ? reportsData : (reportsData.reports || []));
      setUserRole(statsData.role);
      setPayouts(Array.isArray(payoutsData) ? payoutsData : []);

      if (statsData.role === "SUPPLIER") {
        setSavings(savingsData?.history || []);
      } else {
        setSavings(Array.isArray(savingsData) ? savingsData : []);
      }
    } catch (err) {
      console.error("Failed to fetch archive data:", err);
      toast.error("Gagal memuat data arsip");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedReports = useMemo(() => {
    const groups: Record<string, any> = {};
    reports.forEach(report => {
      const key = report.noteNumber || `TANPA-NOTA-${report.id}`;
      if (!groups[key]) {
        groups[key] = {
          id: report.id,
          noteNumber: report.noteNumber,
          date: report.date || report.createdAt,
          revenue: 0,
          profit80: 0,
          profit20: 0,
          itemCount: 0,
          suppliers: [] as string[],
          notes: report.notes || "-",
        };
      }
      groups[key].revenue += report.revenue;
      groups[key].profit80 += report.profit80;
      groups[key].profit20 += report.profit20;
      groups[key].itemCount += 1;
      if (report.supplier?.name && !groups[key].suppliers.includes(report.supplier.name)) {
        groups[key].suppliers.push(report.supplier.name);
      }
    });
    return Object.values(groups).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports]);

  const filteredReports = useMemo(() => {
    return groupedReports.filter((r: any) => {
      const matchSearch =
        (r.noteNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (userRole !== "SUPPLIER" && r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.suppliers.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())));
      
      let matchDate = true;
      if (startDate || endDate) {
        const reportDate = new Date(r.date as string);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (reportDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (reportDate > end) matchDate = false;
        }
      }
      return matchSearch && matchDate;
    });
  }, [groupedReports, searchTerm, userRole, startDate, endDate]);

  const validatedDeposits = useMemo(() => {
    const groups: Record<string, any> = {};
    reports.forEach(r => {
      if (!r.isValidated) return;
      if (!r.supplier) return;

      const reportDate = new Date(r.date || r.createdAt);
      let matchDate = true;
      if (startDate || endDate) {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (reportDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (reportDate > end) matchDate = false;
        }
      }
      if (!matchDate) return;

      const dateStr = format(reportDate, "yyyy-MM-dd");
      const key = `${dateStr}_${r.supplier.id}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          date: r.date || r.createdAt,
          supplierName: r.supplier.name,
          amount: 0,
          paymentMethod: r.supplier.bankName || "CASH"
        };
      }
      groups[key].amount += r.profit80;
    });

    return Object.values(groups)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((d: any) => d.supplierName.toLowerCase().includes(payoutSearch.toLowerCase()));
  }, [reports, payoutSearch, startDate, endDate]);

  const validatedSuppliers = useMemo(() => {
    const groups: Record<string, any> = {};
    reports.forEach(r => {
      if (!r.isValidated) return;
      if (!r.supplier) return;

      const key = r.supplier.id;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          supplierName: r.supplier.name,
          amount: 0,
          paymentMethod: r.supplier.bankName || "CASH"
        };
      }
      groups[key].amount += r.profit80;
    });

    return Object.values(groups)
      .sort((a: any, b: any) => a.supplierName.localeCompare(b.supplierName))
      .filter((d: any) => d.supplierName.toLowerCase().includes(payoutSearch.toLowerCase()));
  }, [reports, payoutSearch]);

  const groupedSavingsByNote = useMemo(() => {
    const groups: Record<string, any> = {};

    reports.forEach(r => {
      if ((r.tabungan || 0) <= 0) return;

      const relevantDate = new Date(r.deductionDate || r.date || r.createdAt);
      let matchDate = true;
      if (startDate || endDate) {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (relevantDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (relevantDate > end) matchDate = false;
        }
      }
      if (!matchDate) return;

      const dateKey = r.deductionDate ? new Date(r.deductionDate).toISOString().split('T')[0] : null;
      const key = r.deductionNoteNumber || (dateKey ? `DATE-${dateKey}` : r.noteNumber) || `TAB-${r.id}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          noteNumber: r.deductionNoteNumber || (r.deductionDate ? `POT-${format(new Date(r.deductionDate), "ddMMyy")}` : r.noteNumber || "-"),
          date: relevantDate,
          totalRevenue: 0,
          totalTabungan: 0,
          suppliers: new Map<string, any>(),
          supplierNames: [] as string[],
        };
      }

      groups[key].totalRevenue += r.revenue;
      groups[key].totalTabungan += r.tabungan;

      if (r.supplier?.name) {
        if (!groups[key].supplierNames.includes(r.supplier.name)) {
          groups[key].supplierNames.push(r.supplier.name);
        }
        const suppMap = groups[key].suppliers;
        if (suppMap.has(r.supplier.id)) {
            const existing = suppMap.get(r.supplier.id);
            existing.revenue += r.revenue;
            existing.tabungan += r.tabungan;
        } else {
            suppMap.set(r.supplier.id, {
                id: r.supplier.id,
                name: r.supplier.name,
                revenue: r.revenue,
                tabungan: r.tabungan
            });
        }
      }
    });

    return Object.values(groups)
      .filter((g: any) => {
        return (g.noteNumber?.toLowerCase().includes(savingsSearch.toLowerCase())) ||
               (g.supplierNames.some((s: string) => s.toLowerCase().includes(savingsSearch.toLowerCase())));
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, savingsSearch, startDate, endDate]);

  const filteredDeductions = useMemo(() => {
    const groups: Record<string, any> = {};

    reports.forEach(r => {
      const hasDeduction = (r.serviceCharge || 0) > 0 || (r.kukuluban || 0) > 0 || (r.tabungan || 0) > 0;
      if (!hasDeduction) return;

      const dateKey = r.deductionDate ? new Date(r.deductionDate).toISOString().split('T')[0] : null;
      const key = r.deductionNoteNumber || (dateKey ? `DATE-${dateKey}` : r.noteNumber) || `DED-${r.id}`;

      if (!groups[key]) {
        groups[key] = {
          id: r.id,
          deductionNoteNumber: r.deductionNoteNumber,
          noteNumber: r.noteNumber,
          deductionDate: r.deductionDate || r.date || r.createdAt,
          date: r.date || r.createdAt,
          serviceCharge: 0,
          kukuluban: 0,
          tabungan: 0,
          supplierNames: [] as string[],
        };
      }

      groups[key].serviceCharge += (r.serviceCharge || 0);
      groups[key].kukuluban += (r.kukuluban || 0);
      groups[key].tabungan += (r.tabungan || 0);

      if (r.supplier?.name && !groups[key].supplierNames.includes(r.supplier.name)) {
        groups[key].supplierNames.push(r.supplier.name);
      }
    });

    return Object.values(groups).filter((g: any) => {
      const matchSearch =
        (g.deductionNoteNumber?.toLowerCase().includes(deductionSearch.toLowerCase())) ||
        (g.noteNumber?.toLowerCase().includes(deductionSearch.toLowerCase())) ||
        (g.supplierNames.some((s: string) => s.toLowerCase().includes(deductionSearch.toLowerCase())));

      let matchDate = true;
      if (startDate || endDate) {
        const reportDate = new Date(g.deductionDate || g.date);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (reportDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (reportDate > end) matchDate = false;
        }
      }
      return matchSearch && matchDate;
    }).sort((a: any, b: any) => new Date(b.deductionDate || b.date).getTime() - new Date(a.deductionDate || a.date).getTime());
  }, [reports, deductionSearch, startDate, endDate]);

  const groupedProductsByNote = useMemo(() => {
    const groups: Record<string, any> = {};

    reports.forEach(r => {
      let matchDate = true;
      if (startDate || endDate) {
        const reportDate = new Date(r.date || r.createdAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (reportDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (reportDate > end) matchDate = false;
        }
      }
      if (!matchDate) return;

      const key = r.noteNumber || `TANPA-NOTA-${r.id}`;
      if (!groups[key]) {
        groups[key] = {
          id: r.id,
          noteNumber: r.noteNumber,
          date: r.date || r.createdAt,
          totalBeli: 0,
          totalJual: 0,
          totalRetureJual: 0,
          products: new Map<string, any>(),
          supplierNames: [] as string[],
        };
      }

      if (r.supplier?.name && !groups[key].supplierNames.includes(r.supplier.name)) {
        groups[key].supplierNames.push(r.supplier.name);
      }

      const items = r.items || [];
      if (Array.isArray(items)) {
        items.forEach(item => {
          const name = (item.name || '').trim();
          if (!name) return;
          
          const qtyBeli = Number(item.qtyBeli ?? item.qty ?? item.beli ?? 0);
          const qtyJual = Number(item.qtyJual ?? item.jual ?? 0);
          const retureJual = Number(item.retureJual ?? item.retur ?? 0);

          groups[key].totalBeli += qtyBeli;
          groups[key].totalJual += qtyJual;
          groups[key].totalRetureJual += retureJual;

          const productMap = groups[key].products;
          if (productMap.has(name)) {
            const existing = productMap.get(name)!;
            existing.totalBeli += qtyBeli;
            existing.totalJual += qtyJual;
            existing.totalRetureJual += retureJual;
          } else {
            productMap.set(name, {
              name,
              totalBeli: qtyBeli,
              totalJual: qtyJual,
              totalRetureJual: retureJual,
            });
          }
        });
      }
    });

    return Object.values(groups)
      .filter((g: any) => {
        return (g.noteNumber?.toLowerCase().includes(produkSearch.toLowerCase())) ||
               (g.supplierNames.some((s: string) => s.toLowerCase().includes(produkSearch.toLowerCase())));
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, produkSearch, startDate, endDate]);

  return {
    loading,
    userRole,
    reports,
    payouts,
    savings,
    searchTerm,
    setSearchTerm,
    payoutSearch,
    setPayoutSearch,
    savingsSearch,
    setSavingsSearch,
    deductionSearch,
    setDeductionSearch,
    produkSearch,
    setProdukSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredReports,
    validatedDeposits,
    validatedSuppliers,
    groupedSavingsByNote,
    filteredDeductions,
    groupedProductsByNote,
    fetchData
  };
}
