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

export function useMasterData() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { suppliers, cashiers, loading, refresh: fetchData };
}
