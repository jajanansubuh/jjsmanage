import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export interface DepositItem {
  id: string;
  name: string;
  ownerName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  dailyProfit: number;
  isValidated: boolean;
  supplier?: any;
}

export function useDepositsData(dateRange: DateRange | undefined) {
  const [data, setData] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
    params.append("limit", "2000");

    Promise.all([
      fetch('/api/auth/role').then(res => res.json()),
      fetch(`/api/reports?${params.toString()}`).then(res => res.json())
    ])
      .then(([roleData, reportsData]) => {
        const userRole = roleData.role;
        setRole(userRole);

        const reports = Array.isArray(reportsData) ? reportsData : (reportsData.reports || []);
        if (Array.isArray(reports)) {
          if (userRole === "SUPPLIER") {
            const history = reports
              .filter((r: any) => r.isValidated)
              .map((r: any) => ({
                id: r.id,
                name: r.noteNumber || `Nota #${r.id.slice(-4)}`,
                ownerName: format(new Date(r.date), "dd MMM yyyy", { locale: localeId }),
                bankName: format(new Date(r.date), "HH:mm") + " WIB",
                accountNumber: r.noteNumber || "-",
                dailyProfit: Number(r.profit80 || 0),
                isValidated: true,
                rawDate: r.date,
                supplier: r.supplier
              }));
            setData(history);
          } else {
            const grouped: Record<string, DepositItem> = {};
            reports.forEach((r: any) => {
              const s = r.supplier;
              if (!s) return;

              if (!grouped[s.id]) {
                grouped[s.id] = {
                  id: s.id,
                  name: s.name,
                  ownerName: s.ownerName,
                  bankName: s.bankName,
                  accountNumber: s.accountNumber,
                  dailyProfit: 0,
                  isValidated: true,
                  supplier: s
                };
              }
              grouped[s.id].dailyProfit += Number(r.profit80 || 0);
              if (!r.isValidated) {
                grouped[s.id].isValidated = false;
              }
            });
            setData(Object.values(grouped));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setLoading(false);
      });
  }, [dateRange]);

  return { data, loading, role, setRole };
}
