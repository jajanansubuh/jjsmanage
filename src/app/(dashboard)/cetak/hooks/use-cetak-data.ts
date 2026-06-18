import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeName } from "@/app/(dashboard)/produk/hooks/use-products-data";
import { useSession } from "@/components/providers/session-provider";
import { PrintQueueItem, Product } from "@/types/cetak";

export function useCetakData() {
  const { user } = useSession();
  const userRole = user?.role?.toUpperCase() || null;
  const [products, setProducts] = useState<Product[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [queueItems, setQueueItems] = useState<PrintQueueItem[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [codeLookupMap, setCodeLookupMap] = useState<Record<string, string>>({});
  const codeLookupMapRef = useRef<Record<string, string>>({});

  const fetchProducts = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const myProducts = await res.json() as Product[];
        
        // Build the code lookup map directly on the fly
        const map: Record<string, string> = {};
        myProducts.forEach((p) => {
          map[`${normalizeName(p.name)}_${p.supplierId || 'null'}`] = p.code || "";
        });
        codeLookupMapRef.current = map;
        setCodeLookupMap(map);

        // Process products and deduplicate
        const finalProductsMap = new Map<string, Product>();
        myProducts.forEach((p) => {
          const normalizedName = normalizeName(p.name);
          if (!normalizedName) return;

          // Remove products without a supplier
          if (!p.supplierId || p.supplierId.trim() === "") return;

          const lookupKey = `${normalizedName}_${p.supplierId || 'null'}`;
          const rawCode = p.code || map[lookupKey] || "";
          const code = String(rawCode).trim();
          
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
            const existing = finalProductsMap.get(key)!;
            const existingCode = existing.code || "";
            if (/[A-Z]/i.test(existingCode) && /^\d+$/.test(code)) {
              existing.code = code;
              existing.id = p.id;
            }
          }
        });

        const displayData = Array.from(finalProductsMap.values());
        setProducts(displayData);
        return { displayData, map };
      }
    } catch (err) {
      console.error("fetchProducts error:", err);
    } finally {
      setIsDataLoading(false);
    }
    return null;
  }, []);

  const fetchQueue = useCallback(async (lookupOverride?: Record<string, string>) => {
    setIsQueueLoading(true);
    try {
      const res = await fetch("/api/print-queue?status=PENDING");
      if (res.ok) {
        const data = await res.json() as PrintQueueItem[];
        const lookup = lookupOverride || codeLookupMapRef.current;
        let enriched = data.map((item) => {
          const lookupKey = `${normalizeName(item.name)}_${item.supplierId || 'null'}`;
          return {
            ...item,
            code: item.code || lookup[lookupKey] || null,
          };
        });
        
        // Remove print queue items that don't have a supplier
        enriched = enriched.filter((item) => item.supplierId && item.supplierId.trim() !== "");

        enriched.sort((a, b) => {
          const sA = (a.supplier?.name || "").toUpperCase();
          const sB = (b.supplier?.name || "").toUpperCase();
          if (sA !== sB) return sA.localeCompare(sB);
          return (a.name || "").toUpperCase().localeCompare((b.name || "").toUpperCase());
        });
        setQueueItems(enriched);
      }
    } catch {}
    finally {
      setIsQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const result = await fetchProducts();
      if (result) {
        await fetchQueue(result.map);
      } else {
        await fetchQueue();
      }
    };
    init();
  }, [fetchProducts, fetchQueue]);

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
