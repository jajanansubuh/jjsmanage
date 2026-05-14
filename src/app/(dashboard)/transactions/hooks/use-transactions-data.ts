import { useState, useEffect } from "react";

export function useTransactionsData() {
  const [suppliers, setSuppliers] = useState<{ id: string, name: string, ownerName?: string | null }[]>([]);
  const [cashiers, setCashiers] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    // Fetch Suppliers
    fetch("/api/suppliers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
          setSuppliers(sortedData);
        }
      });

    // Fetch Cashiers
    fetch("/api/cashiers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCashiers(data);
        }
      });
  }, []);

  return { suppliers, cashiers };
}
