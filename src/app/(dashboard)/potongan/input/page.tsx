"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

// Hooks
import { usePotonganData, DeductionRow } from "./hooks/use-potongan-data";

// Components
import { PotonganHeader } from "@/components/potongan/PotonganHeader";
import { PotonganTable } from "@/components/potongan/PotonganTable";
import { PotonganFooter } from "@/components/potongan/PotonganFooter";

// Dialogs
import { PotonganConfirmDialog } from "@/components/potongan/PotonganConfirmDialog";
import { PotonganSaveSuccessDialog } from "@/components/potongan/PotonganSaveSuccessDialog";

// Utils
import { getPotonganPrintTemplate } from "@/lib/potongan-utils";

function PotonganPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editNote = searchParams.get("edit");

  const [startDate, setStartDate] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jjs-potongan-startDate") || format(new Date(), "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jjs-potongan-endDate") || format(new Date(), "yyyy-MM-dd");
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
    deductionDate,
    setDeductionDate,
    deductionNoteNumber,
    setDeductionNoteNumber,
    actualStartDate,
    actualEndDate,
    refresh
  } = usePotonganData(startDate, endDate, editNote, isMounted);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync dates when editing a note
  useEffect(() => {
    if (editNote && actualStartDate && actualEndDate) {
      setStartDate(actualStartDate);
      setEndDate(actualEndDate);
    }
  }, [editNote, actualStartDate, actualEndDate]);

  // Save to localStorage
  useEffect(() => {
    if (isMounted && !editNote) {
      localStorage.setItem("jjs-potongan-deductionDate", deductionDate);
      localStorage.setItem("jjs-potongan-noteNumber", deductionNoteNumber);
      localStorage.setItem("jjs-potongan-startDate", startDate);
      localStorage.setItem("jjs-potongan-endDate", endDate);
      localStorage.setItem("jjs-potongan-rows", JSON.stringify(rows));
    }
  }, [deductionDate, deductionNoteNumber, startDate, endDate, rows, isMounted, editNote]);

  const updateField = (supplierId: string, field: "serviceCharge" | "kukuluban", value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setRows((prev) => prev.map((row) => {
      if (row.supplierId === supplierId) {
        const newRow = { ...row, [field]: numericValue };
        const totalPotongan = newRow.serviceCharge + newRow.kukuluban + newRow.tabungan;

        if (totalPotongan > row.totalCost) {
          toast.error(`Total potongan tidak boleh melebihi total cost (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.totalCost)})`);

          const otherFieldsTotal = totalPotongan - numericValue;
          const maxAllowed = Math.max(0, row.totalCost - otherFieldsTotal);
          newRow[field] = maxAllowed;
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
        toast.info(`${removed.supplierName} dihapus dari daftar input potongan`);
      }
      return updated;
    });
  }, [setRows]);

  const totals = useMemo(() => {
    return {
      serviceCharge: rows.reduce((sum, r) => sum + r.serviceCharge, 0),
      kukuluban: rows.reduce((sum, r) => sum + r.kukuluban, 0),
      grandTotal: rows.reduce((sum, r) => sum + r.serviceCharge + r.kukuluban, 0),
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
          serviceCharge: r.serviceCharge,
          kukuluban: r.kukuluban,
          deductionDate: deductionDate,
          deductionNoteNumber: deductionNoteNumber,
        }))
      };

      const res = await fetch("/api/deductions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsConfirmDialogOpen(false);
        setSavedNoteInfo({
          noteNumber: deductionNoteNumber,
          date: deductionDate,
          startDate: actualStartDate,
          endDate: actualEndDate,
          totals,
          details: [...rows],
        });
        setIsSaveSuccessModalOpen(true);

        // Only clear localStorage after confirmed successful save
        localStorage.removeItem("jjs-potongan-rows");
        localStorage.removeItem("jjs-potongan-deductionDate");
        localStorage.removeItem("jjs-potongan-noteNumber");
        localStorage.removeItem("jjs-potongan-startDate");
        localStorage.removeItem("jjs-potongan-endDate");
        const nextNum = Math.floor(Math.random() * 900) + 100;
        setDeductionNoteNumber(`POT-${format(new Date(), "ddMMyy")}${nextNum}`);
        setRows([]);
      } else {
        toast.error(result.details ? `${result.error}: ${result.details}` : (result.error || "Gagal menyimpan potongan"));
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
    printWindow.document.write(getPotonganPrintTemplate(savedNoteInfo));
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
      <PotonganHeader
        deductionNoteNumber={deductionNoteNumber}
        setDeductionNoteNumber={setDeductionNoteNumber}
        deductionDate={deductionDate}
        setDeductionDate={setDeductionDate}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <PotonganTable
        loading={loading}
        rows={filteredRows}
        onUpdateField={updateField}
        onDeleteRow={handleDeleteRow}
      />

      <PotonganFooter
        totals={totals}
        onSave={handleOpenConfirm}
        isSaving={isSaving}
        hasRows={rows.length > 0}
      />

      {/* Confirmation Dialog before saving */}
      <PotonganConfirmDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        deductionNoteNumber={deductionNoteNumber}
        deductionDate={deductionDate}
        startDate={actualStartDate}
        endDate={actualEndDate}
        rows={rows}
        totals={totals}
        onConfirm={handleSave}
        isSaving={isSaving}
      />

      {/* Success Dialog after saving */}
      <PotonganSaveSuccessDialog
        isOpen={isSaveSuccessModalOpen}
        onOpenChange={setIsSaveSuccessModalOpen}
        savedNoteInfo={savedNoteInfo}
        onPrint={handlePrint}
        onFinish={() => {
          setIsSaveSuccessModalOpen(false);
          router.push("/potongan");
        }}
      />
    </div>
  );
}

export default function PotonganPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-500 font-bold">Memuat Potongan...</div>}>
      <PotonganPageContent />
    </Suspense>
  );
}
