import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export interface AggregatedProduct {
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
    .replace(/[.,\s]+$/, "")
    .replace(/\s+/g, " ");
};

export function useProductsData(dateRange: DateRange | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<AggregatedProduct[]>([]);
  const [masterProducts, setMasterProducts] = useState<Record<string, string>>({});
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [role, setRole] = useState<string | null>(null);

  const fetchRole = async () => {
    try {
      const res = await fetch("/api/auth/role");
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
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

      const masterMap: Record<string, { code: string; supplierName: string; supplierId: string }> = {};
      masterData.forEach((p: any) => {
        const key = normalizeName(p.name);
        masterMap[key] = {
          code: p.code || "",
          supplierName: p.supplier?.name || "Tanpa Suplier",
          supplierId: p.supplierId || ""
        };
      });

      const productMap = new Map<string, AggregatedProduct>();
      reports.forEach((report: any) => {
        const items = report.items || [];
        const reportSupplierName = report.supplier?.name || "Tanpa Suplier";
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const rawName = (item.name || '').trim();
            if (!rawName) return;
            const name = rawName.toUpperCase();

            if (productMap.has(name)) {
              const existing = productMap.get(name)!;
              existing.totalBeli += Number(item.qtyBeli ?? item.qty ?? item.beli ?? 0);
              existing.totalJual += Number(item.qtyJual ?? item.jual ?? 0);
              existing.totalRetureJual += Number(item.retureJual ?? item.retur ?? 0);
              existing.transactions += 1;
              if (existing.supplierName === "Tanpa Suplier") {
                existing.supplierName = reportSupplierName;
              }
            } else {
              productMap.set(name, {
                name,
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

      const productsList = Array.from(productMap.values()).map(p => {
        const key = normalizeName(p.name);
        const master = masterMap[key];
        return {
          ...p,
          code: master?.code || "",
          supplierName: master?.supplierName && master.supplierName !== "Tanpa Suplier" ? master.supplierName : p.supplierName,
          supplierId: master?.supplierId || ""
        };
      });

      setProducts(productsList);
      setMasterProducts(Object.fromEntries(Object.entries(masterMap).map(([k, v]) => [k, v.code])));
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

  return { loading, error, products, masterProducts, suppliers, role, refresh: fetchData };
}
