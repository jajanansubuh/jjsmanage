import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export interface ReportRow {
  id: string;
  supplierId: string;
  revenue: number;
  barcode: number;
  cost: number;
  serviceCharge: number;
  kukuluban: number;
  tabungan: number;
  profit80: number;
  profit20: number;
  items?: { name: string; qtyBeli: number; qtyJual: number; retureJual: number }[];
  importedSupplierName?: string;
}

export function useTransactionForm(isMounted: boolean, isEditMode: boolean, editNoteParam: string | null) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedCashiers, setSelectedCashiers] = useState<string[]>([]);
  const [noteNumber, setNoteNumber] = useState(editNoteParam || "");
  const [notes, setNotes] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Load persistence
  useEffect(() => {
    if (isMounted && !isEditMode && !editNoteParam) {
      const savedRows = localStorage.getItem("jjs-transactions-rows");
      if (savedRows) setRows(JSON.parse(savedRows));
    }
    
    const savedCashiers = localStorage.getItem("jjs-transactions-cashiers");
    if (savedCashiers) setSelectedCashiers(JSON.parse(savedCashiers));
  }, [isMounted, isEditMode, editNoteParam]);

  // Save persistence
  useEffect(() => {
    if (isMounted && !isEditMode && !editNoteParam) {
      localStorage.setItem("jjs-transactions-rows", JSON.stringify(rows));
    }
  }, [rows, isMounted, isEditMode, editNoteParam]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("jjs-transactions-cashiers", JSON.stringify(selectedCashiers));
    }
  }, [selectedCashiers, isMounted]);

  const updateRowField = useCallback((id: string, field: keyof ReportRow, value: string) => {
    setRows(prevRows => prevRows.map(row => {
      if (row.id === id) {
        let updatedValue: any = value;
        if (field !== "supplierId") {
          updatedValue = parseInt(value.replace(/\D/g, ""), 10) || 0;
        }

        const updatedRow = { ...row, [field]: updatedValue };

        if (field !== "supplierId") {
          updatedRow.profit80 = updatedRow.cost - updatedRow.barcode;
          updatedRow.profit20 = updatedRow.revenue - updatedRow.cost;
        } else {
          updatedRow.importedSupplierName = undefined;
        }

        return updatedRow;
      }
      return row;
    }));
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows(prevRows => prevRows.filter((_, i) => i !== index));
  }, []);

  const totals = useMemo(() => {
    const calculateTotal = (field: keyof ReportRow) => {
      return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
    };
    return {
      revenue: calculateTotal("revenue"),
      cost: calculateTotal("cost"),
      barcode: calculateTotal("barcode"),
      serviceCharge: calculateTotal("serviceCharge"),
      kukuluban: calculateTotal("kukuluban"),
      tabungan: calculateTotal("tabungan"),
      profit80: calculateTotal("profit80"),
      profit20: calculateTotal("profit20"),
    };
  }, [rows]);

  return {
    rows,
    setRows,
    selectedDate,
    setSelectedDate,
    selectedCashiers,
    setSelectedCashiers,
    noteNumber,
    setNoteNumber,
    notes,
    setNotes,
    sortOrder,
    setSortOrder,
    updateRowField,
    removeRow,
    totals
  };
}
