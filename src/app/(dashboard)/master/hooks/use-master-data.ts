import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Supplier {
  id: string;
  name: string;
  ownerName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  balance: number;
  users?: { id: string, username: string, isCredentialsChanged: boolean }[];
}

export interface Cashier {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  name: string;
  code: string | null;
  supplierId: string | null;
  supplier?: { id: string, name: string } | null;
}

export function useMasterData() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/products?forLookup=true");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
      toast.error("Gagal mengambil data produk");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [suppRes, cashRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/cashiers")
      ]);
      const suppData = await suppRes.json();
      const cashData = await cashRes.json();
      setSuppliers(suppData);
      setCashiers(cashData);
      
      // Fetch products simultaneously
      await fetchProducts();
    } catch (error) {
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    suppliers, 
    cashiers, 
    products, 
    loading, 
    productsLoading, 
    refresh: fetchData, 
    refreshProducts: fetchProducts 
  };
}
