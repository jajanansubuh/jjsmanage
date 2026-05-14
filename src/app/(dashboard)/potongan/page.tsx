"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateAggregatedDeductionsAction } from "@/lib/actions/deductions";

// Hooks
import { usePotonganData, DeductionRow } from "./hooks/use-potongan-data";

// Components
import { PotonganHeader } from "@/components/potongan/PotonganHeader";
import { PotonganTable } from "@/components/potongan/PotonganTable";
import { PotonganFooter } from "@/components/potongan/PotonganFooter";

// Dialogs
import { PotonganSaveSuccessDialog } from "@/components/potongan/PotonganSaveSuccessDialog";

// Utils
import { getPotonganPrintTemplate } from "@/lib/potongan-utils";

function PotonganPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editNote = searchParams.get("edit");

  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const updateField = (supplierId: string, field: "serviceCharge" | "kukuluban" | "tabungan", value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setRows((prev) => prev.map((row) => (row.supplierId === supplierId ? { ...row, [field]: numericValue } : row)));
  };

  const totals = useMemo(() => {
    return {
      serviceCharge: rows.reduce((sum, r) => sum + r.serviceCharge, 0),
      kukuluban: rows.reduce((sum, r) => sum + r.kukuluban, 0),
      tabungan: rows.reduce((sum, r) => sum + r.tabungan, 0),
      grandTotal: rows.reduce((sum, r) => sum + r.serviceCharge + r.kukuluban + r.tabungan, 0),
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(
      (r) =>
        r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.noteNumbers.some((n) => n.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rows, searchTerm]);

  const handleSave = async () => {
    if (rows.length === 0) return;
    setIsSaving(true);
    try {
      const result = await updateAggregatedDeductionsAction(
        rows.map((r) => ({
          supplierId: r.supplierId,
          startDate: actualStartDate,
          endDate: actualEndDate,
          serviceCharge: r.serviceCharge,
          kukuluban: r.kukuluban,
          tabungan: r.tabungan,
          deductionDate: deductionDate,
          deductionNoteNumber: deductionNoteNumber,
        }))
      );

      if (result.success) {
        setSavedNoteInfo({
          noteNumber: deductionNoteNumber,
          date: deductionDate,
          startDate: actualStartDate,
          endDate: actualEndDate,
          totals,
          details: [...rows],
        });
        setIsSaveSuccessModalOpen(true);

        localStorage.removeItem("jjs-potongan-rows");
        const nextNum = Math.floor(Math.random() * 900) + 100;
        setDeductionNoteNumber(`POT-${format(new Date(), "ddMMyy")}${nextNum}`);
        setRows([]);
      } else {
        toast.error(result.error || "Gagal menyimpan potongan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
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
      />

      <PotonganFooter 
        totals={totals}
        onSave={handleSave}
        isSaving={isSaving}
        hasRows={rows.length > 0}
      />

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
