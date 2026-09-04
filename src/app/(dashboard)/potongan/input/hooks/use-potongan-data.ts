import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export interface DeductionRow {
  supplierId: string;
  supplierName: string;
  noteNumbers: string[];
  totalCost: number;
  totalBarcode: number;
  existingServiceCharge: number;
  existingKukuluban: number;
  serviceCharge: number;
  kukuluban: number;
  tabungan: number;
  baseProfit80: number;
}

export function syncNoteNumberWithDate(dateStr: string, currentNote: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return currentNote;
    const dateFormatted = format(d, "ddMMyy");
    
    // Match POT-ddMMyy(suffix) e.g. POT-200826001 -> prefix POT-, 6 digits date, suffix 001
    const match = currentNote.match(/^POT-(\d{6})(.*)$/);
    if (match) {
      const suffix = match[2] || "001";
      return `POT-${dateFormatted}${suffix}`;
    } else if (currentNote.startsWith("POT-")) {
      const suffix = currentNote.replace(/^POT-/, "");
      return `POT-${dateFormatted}${suffix || "001"}`;
    }
    return `POT-${dateFormatted}001`;
  } catch {
    return currentNote;
  }
}

export function usePotonganData(startDate: string, endDate: string, editNote: string | null, isMounted: boolean) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DeductionRow[]>([]);
  
  const [deductionDate, setDeductionDateState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jjs-potongan-deductionDate") || format(new Date(), "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  });

  const [deductionNoteNumber, setDeductionNoteNumber] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jjs-potongan-noteNumber");
      if (saved) return saved;
    }
    return `POT-${format(new Date(), "ddMMyy")}001`;
  });

  const setDeductionDate = useCallback((newDate: string) => {
    setDeductionDateState(newDate);
    setDeductionNoteNumber((prevNote) => syncNoteNumberWithDate(newDate, prevNote));
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

      const groups: Record<string, DeductionRow> = {};
      reports.forEach((r: any) => {
        if (r.deductionNoteNumber) return;

        const sId = r.supplierId;
        if (!groups[sId]) {
          groups[sId] = {
            supplierId: sId,
            supplierName: r.supplier?.name || "Unknown",
            noteNumbers: [],
            totalCost: 0,
            totalBarcode: 0,
            existingServiceCharge: 0,
            existingKukuluban: 0,
            serviceCharge: 0, // Default 0 for fresh input
            kukuluban: 0, // Default 0 for fresh input
            tabungan: 0,
            baseProfit80: 0,
          };
        }

        if (r.noteNumber && !groups[sId].noteNumbers.includes(r.noteNumber)) {
          groups[sId].noteNumbers.push(r.noteNumber);
        }

        groups[sId].totalCost += r.cost || 0;
        groups[sId].totalBarcode += r.barcode || 0;
        groups[sId].existingServiceCharge += r.serviceCharge || 0;
        groups[sId].existingKukuluban += r.kukuluban || 0;
        groups[sId].tabungan += r.tabungan || 0;
        groups[sId].baseProfit80 += (r.cost || 0) - (r.barcode || 0);
      });

      const aggregatedRows = Object.values(groups).sort((a, b) => a.supplierName.localeCompare(b.supplierName));
      
      const savedRowsStr = localStorage.getItem("jjs-potongan-rows");
      if (savedRowsStr) {
        try {
          const savedRows = JSON.parse(savedRowsStr) as DeductionRow[];
          const mergedRows = aggregatedRows.map(row => {
            const saved = savedRows.find(s => s.supplierId === row.supplierId);
            return saved ? { ...row, serviceCharge: saved.serviceCharge || 0, kukuluban: saved.kukuluban || 0 } : row;
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

  const fetchDeductionForEdit = useCallback(async (noteNum: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?deductionNoteNumber=${noteNum}&limit=5000`);
      const data = await res.json();
      const reports = Array.isArray(data) ? data : data.reports || [];

      if (reports.length === 0) {
        toast.error("Nota potongan tidak ditemukan");
        return;
      }

      const first = reports[0];
      if (first.deductionDate) {
        const dDate = format(new Date(first.deductionDate), "yyyy-MM-dd");
        setDeductionDateState(dDate);
      }
      setDeductionNoteNumber(first.deductionNoteNumber || noteNum);
      
      const dates = reports
        .map((r: any) => new Date(r.date).getTime())
        .filter((t: number) => !isNaN(t));

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        setActualStartDate(format(minDate, "yyyy-MM-dd"));
        setActualEndDate(format(maxDate, "yyyy-MM-dd"));
      }
      
      const groups: Record<string, DeductionRow> = {};
      reports.forEach((r: any) => {
        const sId = r.supplierId;
        if (!groups[sId]) {
          groups[sId] = {
            supplierId: sId,
            supplierName: r.supplier?.name || "Unknown",
            noteNumbers: [],
            totalCost: 0,
            totalBarcode: 0,
            existingServiceCharge: 0,
            existingKukuluban: 0,
            serviceCharge: 0,
            kukuluban: 0,
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
      toast.error("Gagal memuat data potongan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (editNote) fetchDeductionForEdit(editNote);
      else fetchReports(startDate, endDate);
    }
  }, [startDate, endDate, isMounted, editNote, fetchReports, fetchDeductionForEdit]);

  return { 
    loading, 
    rows, 
    setRows, 
    deductionDate, 
    setDeductionDate, 
    deductionNoteNumber, 
    setDeductionNoteNumber,
    actualStartDate,
    actualEndDate,
    refresh: () => editNote ? fetchDeductionForEdit(editNote) : fetchReports(startDate, endDate)
  };
}
