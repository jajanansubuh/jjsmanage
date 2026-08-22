"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

// Hooks
import { useSavingsData, SavingsRow } from "./hooks/use-savings-data";

// Components
import { SavingsInputHeader } from "@/components/savings/SavingsInputHeader";
import { SavingsInputTable } from "@/components/savings/SavingsInputTable";
import { SavingsInputFooter } from "@/components/savings/SavingsInputFooter";

// Dialogs
import { SavingsConfirmDialog } from "@/components/savings/SavingsConfirmDialog";
import { SavingsSaveSuccessDialog } from "@/components/savings/SavingsSaveSuccessDialog";

// Utils
import { getTabunganPrintTemplate } from "@/lib/savings-utils";

function SavingsInputPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editNote = searchParams.get("edit");

  const [startDate, setStartDate] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jjs-savings-startDate") || format(new Date(), "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jjs-savings-endDate") || format(new Date(), "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] = useState(false);
  const [savedNoteInfo, setSavedNoteInfo] = useState<any>(null);

  const {
    loading,
    rows,
    setRows,
    savingsDate,
    setSavingsDate,
    savingsNoteNumber,
    setSavingsNoteNumber,
    actualStartDate,
    actualEndDate,
    refresh
  } = useSavingsData(startDate, endDate, editNote, isMounted);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted && !editNote) {
      localStorage.setItem("jjs-savings-date", savingsDate);
      localStorage.setItem("jjs-savings-noteNumber", savingsNoteNumber);
      localStorage.setItem("jjs-savings-startDate", startDate);
      localStorage.setItem("jjs-savings-endDate", endDate);
      localStorage.setItem("jjs-savings-rows", JSON.stringify(rows));
    }
  }, [savingsDate, savingsNoteNumber, startDate, endDate, rows, isMounted]);

  const updateField = (supplierId: string, value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setRows((prev) => prev.map((row) => {
      if (row.supplierId === supplierId) {
        const newRow = { ...row, tabungan: numericValue };
        const totalPotongan = newRow.serviceCharge + newRow.kukuluban + newRow.tabungan;

        if (totalPotongan > row.totalCost) {
          toast.error(`Total tabungan & potongan tidak boleh melebihi total cost (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.totalCost)})`);

          const otherFieldsTotal = newRow.serviceCharge + newRow.kukuluban;
          const maxAllowed = Math.max(0, row.totalCost - otherFieldsTotal);
          newRow.tabungan = maxAllowed;
        }
        return newRow;
      }
      return row;
    }));
  };

  const handleDeleteRow = useCallback((supplierId: string) => {
    setRows((prev) => {
      const removed = prev.find((r) => r.supplierId === supplierId);
      const updated = prev.filter((r) => r.supplierId !== supplierId);
      if (removed) {
        toast.info(`${removed.supplierName} dihapus dari daftar input tabungan`);
      }
      return updated;
    });
  }, [setRows]);

  const totals = useMemo(() => {
    const totalTabungan = rows.reduce((sum, r) => sum + r.tabungan, 0);
    const saversCount = rows.filter((r) => r.tabungan > 0).length;
    return {
      tabungan: totalTabungan,
      saversCount,
      totalSuppliers: rows.length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(
      (r) =>
        r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.noteNumbers.some((n) => n.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rows, searchTerm]);

  const handleOpenConfirm = () => {
    if (rows.length === 0) {
      toast.error("Tidak ada data transaksi untuk disimpan");
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const handleSave = async () => {
    if (rows.length === 0) return;
    setIsSaving(true);
    try {
      const payload = {
        data: rows.map((r) => ({
          supplierId: r.supplierId,
          startDate: actualStartDate,
          endDate: actualEndDate,
          tabungan: r.tabungan,
          savingsDate: savingsDate,
          savingsNoteNumber: savingsNoteNumber,
        }))
      };

      const res = await fetch("/api/savings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsConfirmDialogOpen(false);
        setSavedNoteInfo({
          noteNumber: savingsNoteNumber,
          date: savingsDate,
          startDate: actualStartDate,
          endDate: actualEndDate,
          totals,
          details: [...rows],
        });
        setIsSaveSuccessModalOpen(true);

        // Clear localStorage on confirmed save
        localStorage.removeItem("jjs-savings-rows");
        localStorage.removeItem("jjs-savings-date");
        localStorage.removeItem("jjs-savings-noteNumber");
        localStorage.removeItem("jjs-savings-startDate");
        localStorage.removeItem("jjs-savings-endDate");
        const nextNum = Math.floor(Math.random() * 900) + 100;
        setSavingsNoteNumber(`TAB-${format(new Date(), "ddMMyy")}${nextNum}`);
        setRows([]);
      } else {
        toast.error(result.details ? `${result.error}: ${result.details}` : (result.error || "Gagal menyimpan tabungan"));
      }
    } catch (error) {
      console.error("handleSave error:", error);
      toast.error("Gagal menyimpan: koneksi ke server gagal. Data input Anda tersimpan di browser dan tidak akan hilang.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!savedNoteInfo) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(getTabunganPrintTemplate(savedNoteInfo));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10 px-4">
      <SavingsInputHeader
        savingsNoteNumber={savingsNoteNumber}
        savingsDate={savingsDate}
        setSavingsDate={setSavingsDate}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <SavingsInputTable
        loading={loading}
        rows={filteredRows}
        onUpdateField={updateField}
        onDeleteRow={handleDeleteRow}
      />

      <SavingsInputFooter
        totals={totals}
        onSave={handleOpenConfirm}
        isSaving={isSaving}
        hasRows={rows.length > 0}
      />

      {/* Confirmation Dialog before saving */}
      <SavingsConfirmDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        savingsNoteNumber={savingsNoteNumber}
        savingsDate={savingsDate}
        startDate={actualStartDate}
        endDate={actualEndDate}
        rows={rows}
        totals={totals}
        onConfirm={handleSave}
        isSaving={isSaving}
      />

      {/* Success Dialog after saving */}
      <SavingsSaveSuccessDialog
        isOpen={isSaveSuccessModalOpen}
        onOpenChange={setIsSaveSuccessModalOpen}
        savedNoteInfo={savedNoteInfo}
        onPrint={handlePrint}
        onFinish={() => {
          setIsSaveSuccessModalOpen(false);
          router.push("/savings");
        }}
      />
    </div>
  );
}

export default function SavingsInputPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-500 font-bold">Memuat Input Tabungan...</div>}>
      <SavingsInputPageContent />
    </Suspense>
  );
}
