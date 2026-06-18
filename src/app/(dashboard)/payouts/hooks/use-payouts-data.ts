import { useState, useEffect } from "react";
import { useSession } from "@/components/providers/session-provider";

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

export function usePayoutsData(selectedMonth: Date | undefined) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSession();
  const userRole = user?.role?.toUpperCase() || null;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedMonth) {
          const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
          const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);
          
          const formatDate = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          };
          
          params.append("startDate", formatDate(monthStart));
          params.append("endDate", formatDate(monthEnd));
        }
        params.append("limit", "1000");

        const res = await fetch(`/api/reports?${params.toString()}`);
        
        if (res.ok) {
          const data = await res.json();
          const reportsData = Array.isArray(data) ? data : (data.reports || []);
          setTransactions(reportsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [selectedMonth]);

  return { transactions, loading, userRole };
}
