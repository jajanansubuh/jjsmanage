"use client";

import { useState, useMemo } from "react";

// Hooks
import { usePayoutsData } from "./hooks/use-payouts-data";

// Components
import { PayoutsHeader } from "@/components/payouts/PayoutsHeader";
import { PayoutsStats } from "@/components/payouts/PayoutsStats";
import { PayoutsTable } from "@/components/payouts/PayoutsTable";

export default function PayoutsPage() {
  const { transactions, loading, userRole } = usePayoutsData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const filteredAndSorted = useMemo(() => {
    let result = [...transactions];

    if (selectedMonth) {
      const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);
      result = result.filter((t) => {
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd;
      });
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((t) =>
        (t.noteNumber && t.noteNumber.toLowerCase().includes(lower)) ||
        (userRole !== "SUPPLIER" && t.notes && t.notes.toLowerCase().includes(lower)) ||
        (t.supplier?.name && t.supplier.name.toLowerCase().includes(lower))
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        switch (sortConfig.key) {
          case "date": valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); break;
          case "noteNumber": valA = a.noteNumber || ""; valB = b.noteNumber || ""; break;
          case "revenue": valA = a.revenue; valB = b.revenue; break;
          case "profit80": valA = a.profit80; valB = b.profit80; break;
          default: valA = ""; valB = "";
        }
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [transactions, searchTerm, selectedMonth, sortConfig, userRole]);

  const totalProfit80 = useMemo(() => filteredAndSorted.reduce((sum, t) => sum + t.profit80, 0), [filteredAndSorted]);
  const totalRevenue = useMemo(() => filteredAndSorted.reduce((sum, t) => sum + t.revenue, 0), [filteredAndSorted]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10 px-0 md:px-0">
      <PayoutsHeader 
        userRole={userRole}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />

      <PayoutsStats 
        totalTransactions={filteredAndSorted.length}
        totalRevenue={totalRevenue}
        totalProfit80={totalProfit80}
      />

      <PayoutsTable 
        transactions={filteredAndSorted}
        loading={loading}
        userRole={userRole}
        onSort={handleSort}
        totalRevenue={totalRevenue}
        totalProfit80={totalProfit80}
      />
    </div>
  );
}
