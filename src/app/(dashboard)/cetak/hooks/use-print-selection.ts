import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Product } from "./use-cetak-data";
import { normalizeName } from "@/app/(dashboard)/produk/hooks/use-products-data";

export function usePrintSelection(initialRole: string | null) {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const sortedSelectedItems = useMemo(() => {
    return [...selectedItems].sort((a, b) => {
      const sA = (a.supplierName || "").toUpperCase();
      const sB = (b.supplierName || "").toUpperCase();
      if (sA !== sB) return sA.localeCompare(sB);
      return (a.name || "").toUpperCase().localeCompare((b.name || "").toUpperCase());
    });
  }, [selectedItems]);

  const addItem = useCallback((product: Product) => {
    setSelectedItems(prev => {
      if (prev.find(item => item.id === product.id)) {
        toast.info("Produk sudah ada di daftar");
        return prev;
      }
      return [...prev, { 
        ...product, 
        qty: 1, 
        supplierName: product.supplierName || "Tanpa Suplier" 
      }];
    });
    setSearchTerm("");
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setSelectedItems(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(1, qty) } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addFromQueue = useCallback((item: any, codeLookupMap: Record<string, string>) => {
    setSelectedItems(prev => {
      if (prev.find(si => si.name === item.name && si.code === item.code)) {
        toast.info("Barang sudah ada di daftar cetak");
        return prev;
      }
      const code = item.code || codeLookupMap[normalizeName(item.name)] || null;
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        code, 
        qty: item.qty,
        supplierId: item.supplierId,
        supplierName: item.supplier?.name || "Tanpa Suplier"
      }];
    });
  }, []);

  return {
    selectedItems,
    setSelectedItems,
    searchTerm,
    setSearchTerm,
    sortedSelectedItems,
    addItem,
    updateQty,
    removeItem,
    addFromQueue
  };
}
