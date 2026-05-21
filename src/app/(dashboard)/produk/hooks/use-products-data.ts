import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export interface AggregatedProduct {
  id?: string;
  name: string;
  code?: string;
  supplierId?: string;
  supplierName?: string;
  totalBeli: number;
  totalJual: number;
  totalRetureJual: number;
  transactions: number;
}

export const normalizeName = (name: any) => {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[.,\-\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export function useProductsData(dateRange: DateRange | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<AggregatedProduct[]>([]);
  const [allMasterProducts, setAllMasterProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [userSupplierId, setUserSupplierId] = useState<string | null>(null);

  const fetchRole = async () => {
    try {
      const res = await fetch("/api/auth/role");
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        setUserSupplierId(data.supplierId);
      }
    } catch (err) {}
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.map((s: any) => ({ id: s.id, name: s.name })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (dateRange?.from && !dateRange?.to) return;

      const params = new URLSearchParams();
      if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
      params.append("limit", "5000");

      const [reportsRes, masterRes] = await Promise.all([
        fetch(`/api/reports?${params.toString()}`),
        fetch("/api/products?forLookup=true")
      ]);

      if (!reportsRes.ok) throw new Error("Gagal mengambil data laporan produk");
      
      const reportsData = await reportsRes.json();
      const reports = reportsData.reports || [];
      const masterData = masterRes.ok ? await masterRes.json() : [];

      let currentRole = role;
      let currentSupplierId = userSupplierId;
      if (!currentRole) {
        try {
          const res = await fetch("/api/auth/role");
          if (res.ok) {
            const data = await res.json();
            currentRole = data.role;
            currentSupplierId = data.supplierId;
            setRole(data.role);
            setUserSupplierId(data.supplierId);
          }
        } catch (err) {}
      }

      const masterMap: Record<string, { id: string; name: string; code: string; supplierName: string; supplierId: string }> = {};
      masterData.forEach((p: any) => {
        // Gunakan hanya nama produk sebagai kunci utama
        const key = normalizeName(p.name);
        masterMap[key] = {
          id: p.id,
          name: p.name,
          code: p.code || "",
          supplierName: p.supplier?.name || "Tanpa Suplier",
          supplierId: p.supplierId || ""
        };
      });

      const productMap = new Map<string, AggregatedProduct>();
      reports.forEach((report: any) => {
        const items = report.items || [];
        const reportSupplierName = report.supplier?.name || "Tanpa Suplier";
        const reportSupplierId = report.supplierId;
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const rawName = (item.name || '').trim();
            if (!rawName) return;
            const name = normalizeName(rawName);
            if (!name) return;

            const productKey = name;

            if (productMap.has(productKey)) {
              const existing = productMap.get(productKey)!;
              existing.totalBeli += Number(item.qtyBeli ?? item.qty ?? item.beli ?? 0);
              existing.totalJual += Number(item.qtyJual ?? item.jual ?? 0);
              existing.totalRetureJual += Number(item.retureJual ?? item.retur ?? 0);
              existing.transactions += 1;
              if (existing.supplierName === "Tanpa Suplier" && reportSupplierName !== "Tanpa Suplier") {
                existing.supplierName = reportSupplierName;
                existing.supplierId = reportSupplierId;
              }
            } else {
              productMap.set(productKey, {
                name,
                supplierId: reportSupplierId || undefined,
                supplierName: reportSupplierName,
                totalBeli: Number(item.qtyBeli ?? item.qty ?? item.beli ?? 0),
                totalJual: Number(item.qtyJual ?? item.jual ?? 0),
                totalRetureJual: Number(item.retureJual ?? item.retur ?? 0),
                transactions: 1
              });
            }
          });
        }
      });

      // Tambahkan produk dari master data yang belum ter-record di transaksi/reports
      masterData.forEach((p: any) => {
        const normName = normalizeName(p.name);
        const key = normName;

        // Saring agar supplier hanya melihat produk suplier itu sendiri
        if (currentRole?.toUpperCase() === "SUPPLIER" && currentSupplierId && p.supplierId !== currentSupplierId) {
          return;
        }

        if (!productMap.has(key)) {
          productMap.set(key, {
            id: p.id,
            name: normName,
            code: p.code || "",
            supplierId: p.supplierId || undefined,
            supplierName: p.supplier?.name || "Tanpa Suplier",
            totalBeli: 0,
            totalJual: 0,
            totalRetureJual: 0,
            transactions: 0
          });
        }
      });

      let productsList = Array.from(productMap.values()).map(p => {
        const normalizedName = normalizeName(p.name);
        const key = normalizedName;
        const master = masterMap[key];
        
        return {
          ...p,
          id: master?.id || p.id || "",
          code: master?.code || p.code || "",
          supplierName: master?.supplierName && master.supplierName !== "Tanpa Suplier" ? master.supplierName : p.supplierName,
          supplierId: master?.supplierId || p.supplierId || ""
        };
      });

      if (currentRole?.toUpperCase() === "SUPPLIER" && currentSupplierId) {
        productsList = productsList.filter(p => p.supplierId === currentSupplierId);
      }

      setProducts(productsList);
      setAllMasterProducts(masterData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSuppliers();
    fetchRole();
  }, [dateRange]);

  return { loading, error, products, allMasterProducts, suppliers, role, refresh: fetchData };
}
