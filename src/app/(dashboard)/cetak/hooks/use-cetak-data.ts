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
          map[`${normalizeName(p.name)}_${p.supplierId || 'null'}`] = p.code || "";
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
        
        // Use a Map to deduplicate products based on normalized name ONLY
        // This handles cases like "PRODUK" vs "PRODUK." or different codes for same name
        const finalProductsMap = new Map<string, Product>();
        
        // Process products
        myProducts.forEach((p: any) => {
          const normalizedName = normalizeName(p.name);
          if (!normalizedName) return;

          // Hapus produk yang tidak memiliki suplier
          if (!p.supplierId || p.supplierId.trim() === "") return;

          const lookupKey = `${normalizedName}_${p.supplierId || 'null'}`;
          const rawCode = p.code || lookup[lookupKey] || "";
          const code = String(rawCode).trim();
          
          // Use normalized name AND supplierId as key to ensure separate products per supplier
          const key = lookupKey;
          
          if (!finalProductsMap.has(key)) {
            finalProductsMap.set(key, {
              id: p.id,
              name: p.name,
              code: code || null,
              supplierId: p.supplierId || null,
              supplierName: p.supplier?.name || "Tanpa Suplier"
            });
          } else {
            // If already exists, maybe update with a "better" code (e.g. numeric only)
            const existing = finalProductsMap.get(key)!;
            const existingCode = existing.code || "";
            
            // If current existing code has letters and new code is pure numeric, prioritize the numeric one
            if (/[A-Z]/i.test(existingCode) && /^\d+$/.test(code)) {
              existing.code = code;
              existing.id = p.id; // Also use the ID from the cleaner product
            }
          }
        });

        const displayData = Array.from(finalProductsMap.values());
        setProducts(displayData);
        return displayData;
      }
    } catch (err) {
      console.error("fetchProducts error:", err);
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
        let enriched = data.map((item: any) => {
          const lookupKey = `${normalizeName(item.name)}_${item.supplierId || 'null'}`;
          return {
            ...item,
            code: item.code || lookup[lookupKey] || null,
          };
        });
        
        // Hapus item antrian yang tidak memiliki suplier
        enriched = enriched.filter((item: any) => item.supplierId && item.supplierId.trim() !== "");

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
