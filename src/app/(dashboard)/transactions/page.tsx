"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { saveTransactionAction } from "@/lib/actions/transactions";
import * as XLSX from "xlsx";

// Hooks
import { useTransactionsData } from "./hooks/use-transactions-data";
import { useTransactionForm, ReportRow } from "./hooks/use-transaction-form";
import { useKeyboardNav } from "./hooks/use-keyboard-nav";

// Utils
import { getTransactionPrintTemplate } from "@/lib/transaction-print-template";

// Components
import { TransactionHeader } from "@/components/transactions/TransactionHeader";
import { AddTransactionForm } from "@/components/transactions/AddTransactionForm";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionsFooter } from "@/components/transactions/TransactionsFooter";
import { TransactionSummary } from "@/components/transactions/TransactionSummary";

// Dialogs
import { ImportExcelDialog } from "@/components/transactions/ImportExcelDialog";
import { SaveSuccessDialog } from "@/components/transactions/SaveSuccessDialog";
import { ClearAllDialog } from "@/components/transactions/ClearAllDialog";

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editNoteParam = searchParams.get("edit");
  const [isMounted, setIsMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!editNoteParam);
  const [editNoteNumber, setEditNoteNumber] = useState<string | null>(editNoteParam || null);
  const editInitializedRef = useRef(false);

  const { suppliers, cashiers } = useTransactionsData();
  
  const {
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
  } = useTransactionForm(isMounted, isEditMode, editNoteParam);

  const [formData, setFormData] = useState({
    supplierId: "",
    revenue: "",
    barcode: "0",
    cost: "0",
    serviceCharge: "0",
    kukuluban: "0",
    tabungan: "0"
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] = useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [savedNoteInfo, setSavedNoteInfo] = useState<any>(null);

  const previewProfit80 = (Number(formData.cost) || 0) - (Number(formData.barcode) || 0);
  const previewProfit20 = (Number(formData.revenue) || 0) - (Number(formData.cost) || 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch next note number if not in edit mode
  useEffect(() => {
    if (isEditMode || !isMounted) return;
    const fetchNextNote = async () => {
      try {
        const res = await fetch(`/api/reports/next-note?date=${selectedDate}`);
        const data = await res.json();
        const datePrefix = format(new Date(selectedDate), "ddMMyyyy");
        setNoteNumber(`${datePrefix}${data.nextNumber}`);
      } catch (error) {
        console.error("Failed to fetch next note number:", error);
      }
    };
    fetchNextNote();
  }, [selectedDate, isEditMode, isMounted]);

  // Load edit data
  useEffect(() => {
    if (editNoteParam && !editInitializedRef.current && suppliers.length > 0) {
      editInitializedRef.current = true;
      const fetchEditData = async () => {
        try {
          const res = await fetch(`/api/reports?noteNumber=${encodeURIComponent(editNoteParam)}`);
          const data = await res.json();
          const reportsData = Array.isArray(data) ? data : (data.reports || []);

          if (reportsData.length > 0) {
            setIsEditMode(true);
            setEditNoteNumber(editNoteParam);
            setNoteNumber(editNoteParam);
            if (reportsData[0].date) setSelectedDate(format(new Date(reportsData[0].date), "yyyy-MM-dd"));
            if (reportsData[0].notes) setNotes(reportsData[0].notes);
            
            setRows(reportsData.map((r: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              supplierId: r.supplierId,
              revenue: r.revenue || 0,
              barcode: r.barcode || 0,
              cost: r.cost || 0,
              serviceCharge: r.serviceCharge || 0,
              kukuluban: r.kukuluban || 0,
              tabungan: r.tabungan || 0,
              profit80: r.profit80 || 0,
              profit20: r.profit20 || 0,
              items: r.items || [],
            })));
            toast.info(`Mode edit nota: ${editNoteParam}`);
          } else {
            toast.error("Data nota tidak ditemukan");
            setIsEditMode(false);
          }
        } catch (e) {
          console.error("Failed to fetch edit data:", e);
          toast.error("Gagal memuat data nota");
        }
      };
      fetchEditData();
    }
  }, [editNoteParam, suppliers]);

  const handleAddTransaction = () => {
    if (!formData.supplierId) {
      toast.error("Pilih suplier terlebih dahulu");
      return;
    }

    const rev = parseInt(formData.revenue.replace(/\D/g, ""), 10) || 0;
    const cst = parseInt(formData.cost.replace(/\D/g, ""), 10) || 0;
    const bc = parseInt(formData.barcode.replace(/\D/g, ""), 10) || 0;

    if (rows.some(r => r.supplierId === formData.supplierId)) {
      toast.error("Suplier ini sudah ada di dalam daftar transaksi");
      return;
    }

    setRows([...rows, {
      id: Math.random().toString(36).substr(2, 9),
      supplierId: formData.supplierId,
      revenue: rev,
      barcode: bc,
      cost: cst,
      serviceCharge: 0,
      kukuluban: 0,
      tabungan: 0,
      profit80: cst - bc,
      profit20: rev - cst
    }]);

    setFormData({
      supplierId: "",
      revenue: "",
      barcode: "0",
      cost: "0",
      serviceCharge: "0",
      kukuluban: "0",
      tabungan: "0"
    });

    setTimeout(() => {
      document.getElementById("supplier-combobox-trigger")?.focus();
    }, 0);
  };

  const { handleTableKeyDown, handleFormKeyDown } = useKeyboardNav(handleAddTransaction);

  const handleSave = async () => {
    if (rows.length === 0) {
      toast.error("Tidak ada data transaksi untuk disimpan");
      return;
    }
    if (!noteNumber) {
      toast.error("Nomor nota harus diisi");
      return;
    }
    if (selectedCashiers.length === 0) {
      toast.error("Pilih minimal satu kasir");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: selectedDate,
        noteNumber,
        notes,
        cashierIds: selectedCashiers,
        isEditMode,
        editNoteNumber,
        rows: rows.map(r => ({
          supplierId: r.supplierId,
          revenue: r.revenue,
          barcode: r.barcode,
          cost: r.cost,
          serviceCharge: r.serviceCharge || 0,
          kukuluban: r.kukuluban || 0,
          tabungan: r.tabungan || 0,
          profit80: r.profit80,
          profit20: r.profit20,
          items: r.items || []
        }))
      };

      const result = await saveTransactionAction(payload);
      if (result.success) {
        const cashierNames = selectedCashiers.map(id => cashiers.find(c => c.id === id)?.name).join(", ");
        setSavedNoteInfo({
          noteNumber,
          date: format(new Date(selectedDate), "dd MMMM yyyy"),
          cashierName: cashierNames
        });
        setIsSaveSuccessModalOpen(true);
      } else {
        toast.error(result.details ? `${result.error}: ${result.details}` : (result.error || "Gagal menyimpan transaksi"));
      }
    } catch (e: any) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const exportData = rows.map((r, i) => ({
      No: i + 1,
      "Nama Suplier": suppliers.find(s => s.id === r.supplierId)?.name || r.importedSupplierName || "Unknown",
      Pendapatan: r.revenue,
      Cost: r.cost,
      Barcode: r.barcode,
      "Mitra Jjs": r.profit80,
      "Toko": r.profit20
    }));

    if (exportData.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    XLSX.writeFile(workbook, `Transaksi_${selectedDate}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const findValue = (row: any, ...possibleNames: string[]) => {
          const keys = Object.keys(row);
          for (const name of possibleNames) {
            const foundKey = keys.find(k => k.toLowerCase().trim().startsWith(name.toLowerCase()));
            if (foundKey) return row[foundKey];
          }
          return undefined;
        };

        const importedRowsMap = new Map<string, ReportRow>();

        data.forEach(row => {
          let rawName = (findValue(row, "Nama Supl", "Suplier", "Supplier") || "").toString().trim();
          if (!rawName) return;

          const supplier = suppliers.find(s => s.name.toLowerCase() === rawName.toLowerCase());
          const supplierKey = supplier?.id || rawName;
          
          const revenue = Number(findValue(row, "Pendapatan", "Omset")) || 0;
          const cost = Number(findValue(row, "Cost", "Harga Pokok")) || 0;
          const barcode = Number(findValue(row, "Barcode")) || 0;

          const itemName = (findValue(row, "Nama Barang", "Produk", "Item") || "").toString().trim();
          const qtyBeli = Number(findValue(row, "Qty Beli", "Beli", "Jumlah Beli", "Dikirim")) || 0;
          const qtyJual = Number(findValue(row, "Qty Jual", "Jual", "Laku", "Jumlah Jual")) || 0;
          const retureJual = Number(findValue(row, "Retur", "Return", "Sisa")) || 0;

          let groupedRow = importedRowsMap.get(supplierKey);
          
          if (!groupedRow) {
            groupedRow = {
              id: Math.random().toString(36).substr(2, 9),
              supplierId: supplier?.id || "",
              importedSupplierName: supplier ? undefined : rawName,
              revenue: 0,
              cost: 0,
              barcode: 0,
              serviceCharge: 0,
              kukuluban: 0,
              tabungan: 0,
              profit80: 0,
              profit20: 0,
              items: []
            };
            importedRowsMap.set(supplierKey, groupedRow);
          }

          groupedRow.revenue += revenue;
          groupedRow.cost += cost;
          groupedRow.barcode += barcode;

          if (itemName || qtyBeli > 0 || qtyJual > 0) {
            groupedRow.items!.push({
              name: itemName || "Produk",
              qtyBeli,
              qtyJual,
              retureJual
            });
          }
        });

        const importedRows = Array.from(importedRowsMap.values());

        // Recalculate profits
        importedRows.forEach(r => {
          r.profit80 = r.cost - r.barcode;
          r.profit20 = r.revenue - r.cost;
        });

        setRows(prevRows => {
          const newRows = [...prevRows];
          importedRows.forEach(importedRow => {
            const existingIndex = newRows.findIndex(r => 
              (r.supplierId && r.supplierId === importedRow.supplierId) || 
              (r.importedSupplierName && r.importedSupplierName === importedRow.importedSupplierName)
            );
            
            if (existingIndex >= 0) {
              const existingRow = newRows[existingIndex];
              existingRow.revenue += importedRow.revenue;
              existingRow.cost += importedRow.cost;
              existingRow.barcode += importedRow.barcode;
              existingRow.items = [...(existingRow.items || []), ...(importedRow.items || [])];
              existingRow.profit80 = existingRow.cost - existingRow.barcode;
              existingRow.profit20 = existingRow.revenue - existingRow.cost;
            } else {
              newRows.push(importedRow);
            }
          });
          return newRows;
        });
        
        toast.success(`Berhasil mengimport ${importedRows.length} suplier dengan total ${data.length} produk`);
      } catch (err) {
        toast.error("Gagal membaca file Excel");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const content = getTransactionPrintTemplate(
      savedNoteInfo.noteNumber,
      savedNoteInfo.date,
      savedNoteInfo.cashierName,
      rows,
      totals,
      suppliers
    );
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleFinish = () => {
    localStorage.removeItem("jjs-transactions-rows");
    window.location.href = "/transactions";
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      <TransactionHeader 
        isEditMode={isEditMode}
        editNoteNumber={editNoteNumber}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedCashiers={selectedCashiers}
        setSelectedCashiers={setSelectedCashiers}
        cashiers={cashiers}
        onExport={handleExport}
        onImportClick={() => setIsImportModalOpen(true)}
        onClearAll={() => setIsClearAllDialogOpen(true)}
        hasRows={rows.length > 0}
      />

      <TransactionSummary totals={totals} />

      <TransactionsFooter 
        totals={totals}
        noteNumber={noteNumber}
        onNoteNumberChange={setNoteNumber}
        notes={notes}
        onNotesChange={setNotes}
        isSaving={isSaving}
        onSave={handleSave}
        isEditMode={isEditMode}
        hasRows={rows.length > 0}
      />

      <AddTransactionForm 
        formData={formData}
        onFormNumberChange={(f, v) => setFormData(p => ({ ...p, [f]: v.replace(/\D/g, "") }))}
        onSupplierChange={(v) => setFormData(p => ({ ...p, supplierId: v }))}
        onAdd={handleAddTransaction}
        suppliers={suppliers}
        previewProfit80={previewProfit80}
        previewProfit20={previewProfit20}
        onKeyDown={handleFormKeyDown}
      />

      <TransactionsTable 
        rows={rows}
        suppliers={suppliers}
        onUpdateField={updateRowField}
        onKeyDown={handleTableKeyDown}
        onRemoveRow={removeRow}
        sortOrder={sortOrder}
        totals={totals}
        onToggleSort={() => {
          const newOrder = sortOrder === "asc" ? "desc" : "asc";
          setSortOrder(newOrder);
          setRows([...rows].sort((a, b) => {
            const nameA = suppliers.find(s => s.id === a.supplierId)?.name || "";
            const nameB = suppliers.find(s => s.id === b.supplierId)?.name || "";
            return newOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
          }));
        }}
      />
      {/* Dialogs */}
      <ImportExcelDialog 
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImport}
      />

      <SaveSuccessDialog 
        isOpen={isSaveSuccessModalOpen}
        onOpenChange={setIsSaveSuccessModalOpen}
        savedNoteInfo={savedNoteInfo}
        onPrint={handlePrint}
        onFinish={handleFinish}
      />

      <ClearAllDialog 
        isOpen={isClearAllDialogOpen}
        onOpenChange={setIsClearAllDialogOpen}
        onConfirm={() => {
          setRows([]);
          setIsClearAllDialogOpen(false);
          toast.success("Data direset");
        }}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-500 font-bold">Inisialisasi Transaksi...</div>}>
      <TransactionsPageContent />
    </Suspense>
  );
}
