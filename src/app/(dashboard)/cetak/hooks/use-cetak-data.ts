import { useState, useEffect } from "react";
import { normalizeName } from "@/app/(dashboard)/produk/hooks/use-products-data";

export interface Product {
  id: string;
  name: string;
  code: string | null;
  supplierId: string | null;
  supplierName?: string;
}

export function useCetakData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [codeLookupMap, setCodeLookupMap] = useState<Record<string, string>>({});

  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const role = data.role?.toUpperCase() || "SUPPLIER";
        setUserRole(role);
        return role;
      }
    } catch (err) {
      console.error("Failed to fetch role:", err);
    }
    return null;
  };

  const fetchCodeLookup = async () => {
    try {
      const res = await fetch("/api/products?forLookup=true");
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        data.forEach((p: any) => {
          map[normalizeName(p.name)] = p.code || "";
        });
        setCodeLookupMap(map);
        return map;
      }
    } catch (e) {
      console.error("Failed to fetch code lookup:", e);
    }
    return {};
  };

  const fetchProducts = async (role: string, lookup: Record<string, string>) => {
    setIsDataLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const myProducts = await res.json();
        let displayData = myProducts.map((p: any) => ({
          ...p,
          code: p.code || lookup[normalizeName(p.name)] || null,
          supplierName: p.supplier?.name || "Tanpa Suplier"
        }));

        if (role === "SUPPLIER") {
          try {
            const reportRes = await fetch("/api/reports?limit=50");
            if (reportRes.ok) {
              const reportData = await reportRes.json();
              const existingNames = new Set(displayData.map((p: any) => normalizeName(p.name)));

              reportData.reports?.forEach((report: any) => {
                report.items?.forEach((item: any) => {
                  const rawName = item.name;
                  if (!rawName) return;
                  const normalized = normalizeName(rawName);
                  if (!existingNames.has(normalized)) {
                    displayData.push({
                      id: `report-${normalized}`,
                      name: rawName.toUpperCase(),
                      code: lookup[normalized] || item.code || null,
                      supplierId: report.supplierId,
                      supplierName: report.supplier?.name || "Tanpa Suplier"
                    });
                    existingNames.add(normalized);
                  }
                });
              });
            }
          } catch (e) {}
        }
        setProducts(displayData);
        return displayData;
      }
    } catch (err) {
    } finally {
      setIsDataLoading(false);
    }
    return [];
  };

  const fetchQueue = async (lookupOverride?: Record<string, string>) => {
    setIsQueueLoading(true);
    try {
      const res = await fetch("/api/print-queue?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        const lookup = lookupOverride || codeLookupMap;
        const enriched = data.map((item: any) => ({
          ...item,
          code: item.code || lookup[normalizeName(item.name)] || null,
        }));
        enriched.sort((a: any, b: any) => {
          const sA = (a.supplier?.name || "").toUpperCase();
          const sB = (b.supplier?.name || "").toUpperCase();
          if (sA !== sB) return sA.localeCompare(sB);
          return (a.name || "").toUpperCase().localeCompare((b.name || "").toUpperCase());
        });
        setQueueItems(enriched);
      }
    } catch (err) {}
    finally {
      setIsQueueLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const role = await fetchUserRole();
      const lookup = await fetchCodeLookup();
      if (role) await fetchProducts(role, lookup);
      await fetchQueue(lookup);
    };
    init();
  }, []);

  return { 
    products, 
    isDataLoading, 
    userRole, 
    queueItems, 
    isQueueLoading, 
    codeLookupMap, 
    fetchQueue 
  };
}
