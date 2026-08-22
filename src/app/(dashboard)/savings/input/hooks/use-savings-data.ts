import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export interface SavingsRow {
  supplierId: string;
  supplierName: string;
  noteNumbers: string[];
  totalCost: number;
  totalBarcode: number;
  serviceCharge: number;
  kukuluban: number;
  existingSavings: number;
  tabungan: number;
  baseProfit80: number;
}

export function syncSavingsNoteNumberWithDate(dateStr: string, currentNote: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return currentNote;
    const dateFormatted = format(d, "ddMMyy");
    
    // Match TAB-ddMMyy(suffix) e.g. TAB-200826001 -> prefix TAB-, 6 digits date, suffix 001
    const match = currentNote.match(/^TAB-(\d{6})(.*)$/);
    if (match) {
      const suffix = match[2] || "001";
      return `TAB-${dateFormatted}${suffix}`;
    } else if (currentNote.startsWith("TAB-")) {
      const suffix = currentNote.replace(/^TAB-/, "");
      return `TAB-${dateFormatted}${suffix || "001"}`;
    }
    return `TAB-${dateFormatted}001`;
  } catch {
    return currentNote;
  }
}

export function useSavingsData(startDate: string, endDate: string, editNote: string | null, isMounted: boolean) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SavingsRow[]>([]);
  
  const [savingsDate, setSavingsDateState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jjs-savings-date") || format(new Date(), "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  });

  const [savingsNoteNumber, setSavingsNoteNumber] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jjs-savings-noteNumber");
      if (saved) return saved;
    }
    return `TAB-${format(new Date(), "ddMMyy")}001`;
  });

  const setSavingsDate = useCallback((newDate: string) => {
    setSavingsDateState(newDate);
    setSavingsNoteNumber((prevNote) => syncSavingsNoteNumberWithDate(newDate, prevNote));
  }, []);

  const [actualStartDate, setActualStartDate] = useState(startDate);
  const [actualEndDate, setActualEndDate] = useState(endDate);

  const fetchReports = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setActualStartDate(start);
    setActualEndDate(end);
    try {
      const res = await fetch(`/api/reports?startDate=${start}&endDate=${end}&limit=5000`);
      const data = await res.json();
      const reports = Array.isArray(data) ? data : data.reports || [];

      const groups: Record<string, SavingsRow> = {};
      reports.forEach((r: any) => {
        // Skip transactions that have already been saved for savings (or saved in legacy deduction notes)
        if (r.savingsNoteNumber || (r.deductionNoteNumber && Number(r.tabungan || 0) > 0)) return;

        const sId = r.supplierId;
        if (!groups[sId]) {
          groups[sId] = {
            supplierId: sId,
            supplierName: r.supplier?.name || "Unknown",
            noteNumbers: [],
            totalCost: 0,
            totalBarcode: 0,
            serviceCharge: 0,
            kukuluban: 0,
            existingSavings: 0,
            tabungan: 0, // Default input 0
            baseProfit80: 0,
          };
        }

        if (r.noteNumber && !groups[sId].noteNumbers.includes(r.noteNumber)) {
          groups[sId].noteNumbers.push(r.noteNumber);
        }

        groups[sId].totalCost += r.cost || 0;
        groups[sId].totalBarcode += r.barcode || 0;
        groups[sId].serviceCharge += r.serviceCharge || 0;
        groups[sId].kukuluban += r.kukuluban || 0;
        groups[sId].existingSavings += r.tabungan || 0;
        groups[sId].baseProfit80 += (r.cost || 0) - (r.barcode || 0);
      });

      const aggregatedRows = Object.values(groups).sort((a, b) => a.supplierName.localeCompare(b.supplierName));
      
      const savedRowsStr = localStorage.getItem("jjs-savings-rows");
      if (savedRowsStr) {
        try {
          const savedRows = JSON.parse(savedRowsStr) as SavingsRow[];
          const mergedRows = aggregatedRows.map(row => {
            const saved = savedRows.find(s => s.supplierId === row.supplierId);
            return saved ? { ...row, tabungan: saved.tabungan || 0 } : row;
          });
          setRows(mergedRows);
        } catch {
          setRows(aggregatedRows);
        }
      } else {
        setRows(aggregatedRows);
      }
    } catch (error) {
      toast.error("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSavingsForEdit = useCallback(async (noteNum: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?savingsNoteNumber=${noteNum}&limit=5000`);
      const data = await res.json();
      const reports = Array.isArray(data) ? data : data.reports || [];

      if (reports.length === 0) {
        toast.error("Nota tabungan tidak ditemukan");
        return;
      }

      const first = reports[0];
      if (first.savingsDate) {
        const sDate = format(new Date(first.savingsDate), "yyyy-MM-dd");
        setSavingsDateState(sDate);
      }
      setSavingsNoteNumber(first.savingsNoteNumber || noteNum);
      
      const dates = reports.map((r: any) => new Date(r.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      
      setActualStartDate(format(minDate, "yyyy-MM-dd"));
      setActualEndDate(format(maxDate, "yyyy-MM-dd"));
      
      const groups: Record<string, SavingsRow> = {};
      reports.forEach((r: any) => {
        const sId = r.supplierId;
        if (!groups[sId]) {
          groups[sId] = {
            supplierId: sId,
            supplierName: r.supplier?.name || "Unknown",
            noteNumbers: [],
            totalCost: 0,
            totalBarcode: 0,
            serviceCharge: 0,
            kukuluban: 0,
            existingSavings: 0,
            tabungan: 0,
            baseProfit80: 0,
          };
        }
        if (r.noteNumber && !groups[sId].noteNumbers.includes(r.noteNumber)) {
          groups[sId].noteNumbers.push(r.noteNumber);
        }
        groups[sId].totalCost += r.cost || 0;
        groups[sId].totalBarcode += r.barcode || 0;
        groups[sId].serviceCharge += r.serviceCharge || 0;
        groups[sId].kukuluban += r.kukuluban || 0;
        groups[sId].tabungan += r.tabungan || 0;
        groups[sId].baseProfit80 += (r.cost || 0) - (r.barcode || 0);
      });

      setRows(Object.values(groups).sort((a, b) => a.supplierName.localeCompare(b.supplierName)));
    } catch (error) {
      toast.error("Gagal memuat data tabungan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (editNote) fetchSavingsForEdit(editNote);
      else fetchReports(startDate, endDate);
    }
  }, [startDate, endDate, isMounted, editNote, fetchReports, fetchSavingsForEdit]);

  return { 
    loading, 
    rows, 
    setRows, 
    savingsDate, 
    setSavingsDate, 
    savingsNoteNumber, 
    setSavingsNoteNumber,
    actualStartDate,
    actualEndDate,
    refresh: () => editNote ? fetchSavingsForEdit(editNote) : fetchReports(startDate, endDate)
  };
}
