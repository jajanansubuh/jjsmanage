import { useCallback, useEffect, useState } from "react";
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

export interface SupplierOption {
  id: string;
  name: string;
}

interface RoleResponse {
  role?: string | null;
  supplierId?: string | null;
}

interface MasterProduct {
  id: string;
  name: string;
  code: string | null;
  supplierId: string | null;
  supplier?: SupplierOption | null;
}

interface ReportItem {
  name?: string | null;
  qty?: number | string | null;
  qtyBeli?: number | string | null;
  qtyJual?: number | string | null;
  beli?: number | string | null;
  jual?: number | string | null;
  retureJual?: number | string | null;
  retur?: number | string | null;
}

interface ProductReport {
  supplierId?: string | null;
  supplier?: SupplierOption | null;
  items?: unknown;
}

interface ReportsResponse {
  reports?: ProductReport[];
}

type MasterProductMap = Record<string, {
  id: string;
  name: string;
  code: string;
  supplierName: string;
  supplierId: string;
}>;

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

export const normalizeName = (name: unknown) => {
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
  const [allMasterProducts, setAllMasterProducts] = useState<MasterProduct[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [userSupplierId, setUserSupplierId] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/role");
      if (res.ok) {
        const data = await res.json() as RoleResponse;
        setRole(data.role || null);
        setUserSupplierId(data.supplierId || null);
      }
    } catch {}
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json() as SupplierOption[];
        setSuppliers(
          data
            .map((supplier) => ({ id: supplier.id, name: supplier.name }))
            .sort((first, second) => first.name.localeCompare(second.name))
        );
      }
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  }, []);

  const fetchData = useCallback(async () => {
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
      
      const reportsData = await reportsRes.json() as ReportsResponse;
      const reports = reportsData.reports || [];
      const masterData = masterRes.ok ? await masterRes.json() as MasterProduct[] : [];

      let currentRole = role;
      let currentSupplierId = userSupplierId;
      if (!currentRole) {
        try {
          const res = await fetch("/api/auth/role");
          if (res.ok) {
            const data = await res.json() as RoleResponse;
            currentRole = data.role || null;
            currentSupplierId = data.supplierId || null;
            setRole(currentRole);
            setUserSupplierId(currentSupplierId);
          }
        } catch {}
      }

      const masterMap: MasterProductMap = {};
      masterData.forEach((p) => {
        const key = `${normalizeName(p.name)}_${p.supplierId || "null"}`;
        masterMap[key] = {
          id: p.id,
          name: p.name,
          code: p.code || "",
          supplierName: p.supplier?.name || "Tanpa Suplier",
          supplierId: p.supplierId || ""
        };
      });

      const productMap = new Map<string, AggregatedProduct>();
      reports.forEach((report) => {
        const items = Array.isArray(report.items) ? report.items as ReportItem[] : [];
        const reportSupplierName = report.supplier?.name || "Tanpa Suplier";
        const reportSupplierId = report.supplierId;
        if (items.length > 0) {
          items.forEach((item) => {
            const rawName = (item.name || '').trim();
            if (!rawName) return;
            const name = normalizeName(rawName);
            if (!name) return;

            const productKey = `${name}_${reportSupplierId || "null"}`;

            if (productMap.has(productKey)) {
              const existing = productMap.get(productKey)!;
              existing.totalBeli += toNumber(item.qtyBeli ?? item.qty ?? item.beli);
              existing.totalJual += toNumber(item.qtyJual ?? item.jual);
              existing.totalRetureJual += toNumber(item.retureJual ?? item.retur);
              existing.transactions += 1;
            } else {
              productMap.set(productKey, {
                name,
                supplierId: reportSupplierId || undefined,
                supplierName: reportSupplierName,
                totalBeli: toNumber(item.qtyBeli ?? item.qty ?? item.beli),
                totalJual: toNumber(item.qtyJual ?? item.jual),
                totalRetureJual: toNumber(item.retureJual ?? item.retur),
                transactions: 1
              });
            }
          });
        }
      });

      // Tambahkan produk dari master data yang belum ter-record di transaksi/reports
      masterData.forEach((p) => {
        const normName = normalizeName(p.name);
        const key = `${normName}_${p.supplierId || "null"}`;

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
        const key = `${normalizedName}_${p.supplierId || "null"}`;
        const master = masterMap[key];
        
        return {
          ...p,
          id: master?.id || p.id || "",
          code: master?.code || p.code || "",
          supplierName: master?.supplierName && master?.supplierName !== "Tanpa Suplier" ? master.supplierName : p.supplierName,
          supplierId: master?.supplierId || p.supplierId || ""
        };
      });

      const isCjrSalad = (p: AggregatedProduct) => {
        const supplierLabel = String(p.supplierName || "").trim().toUpperCase();
        return supplierLabel === "CJR" && normalizeName(p.name).includes("SALAD");
      };

      productsList = productsList.filter(p => !isCjrSalad(p));

      const supplierProductNames = new Set(
        productsList
          .filter(p => p.supplierId)
          .map(p => normalizeName(p.name))
      );
      productsList = productsList.filter(p => p.supplierId || !supplierProductNames.has(normalizeName(p.name)));

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
  }, [dateRange, role, userSupplierId]);

  useEffect(() => {
    fetchData();
    fetchSuppliers();
    fetchRole();
  }, [fetchData, fetchRole, fetchSuppliers]);

  return { loading, error, products, allMasterProducts, suppliers, role, refresh: fetchData };
}
