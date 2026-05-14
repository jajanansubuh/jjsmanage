import { useState, useEffect } from "react";

export interface TransactionRecord {
  id: string;
  date: string;
  noteNumber: string | null;
  revenue: number;
  profit80: number;
  profit20: number;
  cost: number;
  barcode: number;
  serviceCharge: number | null;
  kukuluban: number | null;
  tabungan: number | null;
  notes: string | null;
  supplier: {
    id: string;
    name: string;
  };
}

export function usePayoutsData() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [res, statsRes] = await Promise.all([
          fetch(`/api/reports?limit=2000`),
          fetch("/api/stats")
        ]);
        
        if (res.ok) {
          const data = await res.json();
          const reportsData = Array.isArray(data) ? data : (data.reports || []);
          setTransactions(reportsData);
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setUserRole(statsData.role);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { transactions, loading, userRole };
}
