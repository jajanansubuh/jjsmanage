import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export interface DeductionRow {
  supplierId: string;
  supplierName: string;
  noteNumbers: string[];
  totalCost: number;
  totalBarcode: number;
  serviceCharge: number;
  kukuluban: number;
  tabungan: number;
  baseProfit80: number;
}

export function usePotonganData(startDate: string, endDate: string, editNote: string | null, isMounted: boolean) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DeductionRow[]>([]);
  const [deductionDate, setDeductionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deductionNoteNumber, setDeductionNoteNumber] = useState(`POT-${format(new Date(), "ddMMyy")}001`);
  const [actualStartDate, setActualStartDate] = useState(startDate);
  const [actualEndDate, setActualEndDate] = useState(endDate);

  const fetchReports = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?startDate=${start}&endDate=${end}&limit=2000`);
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

      const aggregatedRows = Object.values(groups).sort((a, b) => a.supplierName.localeCompare(b.supplierName));
      
      const savedRowsStr = localStorage.getItem("jjs-potongan-rows");
      if (savedRowsStr) {
        const savedRows = JSON.parse(savedRowsStr) as DeductionRow[];
        const mergedRows = aggregatedRows.map(row => {
          const saved = savedRows.find(s => s.supplierId === row.supplierId);
          return saved ? { ...row, serviceCharge: saved.serviceCharge, kukuluban: saved.kukuluban, tabungan: saved.tabungan } : row;
        });
        setRows(mergedRows);
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
      const res = await fetch(`/api/reports?deductionNoteNumber=${noteNum}&limit=2000`);
      const data = await res.json();
      const reports = Array.isArray(data) ? data : data.reports || [];

      if (reports.length === 0) {
        toast.error("Nota potongan tidak ditemukan");
        return;
      }

      const first = reports[0];
      if (first.deductionDate) setDeductionDate(format(new Date(first.deductionDate), "yyyy-MM-dd"));
      setDeductionNoteNumber(first.deductionNoteNumber || noteNum);
      
      const dates = reports.map((r: any) => new Date(r.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      
      setActualStartDate(format(minDate, "yyyy-MM-dd"));
      setActualEndDate(format(maxDate, "yyyy-MM-dd"));
      
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
