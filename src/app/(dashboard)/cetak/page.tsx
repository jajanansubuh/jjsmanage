"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";

// Hooks
import { useCetakData } from "./hooks/use-cetak-data";
import { usePrintSelection } from "./hooks/use-print-selection";

// Components
import { CetakHeader } from "@/components/cetak/CetakHeader";
import { CetakQueueList } from "@/components/cetak/CetakQueueList";
import { CetakProductSearch } from "@/components/cetak/CetakProductSearch";
import { CetakSelectedTable } from "@/components/cetak/CetakSelectedTable";
import { CetakPrintView } from "@/components/cetak/CetakPrintView";
import { SupplierPrintHistory } from "@/components/cetak/SupplierPrintHistory";
import { AdminPrintHistory } from "@/components/cetak/AdminPrintHistory";

// Dialogs
import { ClearQueueDialog } from "@/components/cetak/ClearQueueDialog";
import { ConfirmDoneDialog } from "@/components/cetak/ConfirmDoneDialog";
import { normalizeName } from "@/app/(dashboard)/produk/hooks/use-products-data";
import { Product } from "@/types/cetak";

export default function CetakLabelPage() {
  const { 
    products, 
    userRole, 
    queueItems, 
    isQueueLoading, 
    codeLookupMap, 
    fetchQueue 
  } = useCetakData();

  const {
    selectedItems,
    setSelectedItems,
    searchTerm,
    setSearchTerm,
    sortedSelectedItems,
    addItem,
    updateQty,
    removeItem,
    addFromQueue
  } = usePrintSelection();

  const [isSavingQueue, setIsSavingQueue] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearQueueDialogOpen, setIsClearQueueDialogOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [isConfirmDoneOpen, setIsConfirmDoneOpen] = useState(false);
  const [confirmDoneConfig, setConfirmDoneConfig] = useState({
    title: "",
    description: "",
    confirmText: ""
  });

  // Auto-populate for suppliers
  useEffect(() => {
    if (userRole === "SUPPLIER" && products.length > 0 && selectedItems.length === 0) {
      setSelectedItems(products.map(p => ({
        ...p,
        qty: 1,
        supplierName: p.supplierName || p.supplier?.name || "Tanpa Suplier"
      })));
    }
  }, [userRole, products, selectedItems.length, setSelectedItems]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Final fallback deduplication to ensure no double products in UI
    const seen = new Set<string>();
    return filtered.filter(p => {
      const key = `${normalizeName(p.name)}_${p.supplierId || 'null'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 100); // Limit to 100 results for performance
  }, [products, searchTerm]);

  const handleSaveQueue = async () => {
    if (selectedItems.length === 0) return;
    setIsSavingQueue(true);
    try {
      const res = await fetch("/api/print-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedItems.map(item => ({
          name: item.name,
          code: item.code,
          qty: item.qty,
          supplierId: item.supplierId
        })))
      });
      if (res.ok) {
        toast.success("Permintaan cetak berhasil dikirim ke Admin");
        setSelectedItems([]);
        fetchQueue();
        setHistoryKey(prev => prev + 1);
      } else {
        toast.error("Gagal mengirim permintaan");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSavingQueue(false);
    }
  };

  const handleExportQueue = () => {
    if (queueItems.length === 0) return;
    setIsExporting(true);
    try {
      const dataToExport: Array<Record<string, string | number>> = [];
      queueItems.forEach(item => {
        const lookupKey = `${normalizeName(item.name)}_${item.supplierId || 'null'}`;
        const row = {
          "Kode Barang": item.code || codeLookupMap[lookupKey] || "",
          "Nama Barang": item.name,
          "Suplier": item.supplier?.name || "Tanpa Suplier",
          "Qty": 1,
        };
        // Generate multiple rows based on quantity
        for (let i = 0; i < (item.qty || 1); i++) {
          dataToExport.push({ ...row });
        }
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Label Cetak");
      XLSX.writeFile(wb, `Label_Cetak_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Data berhasil diekspor");
      
      // Auto prompt to mark all as completed
      setTimeout(() => {
        setConfirmDoneConfig({
          title: "Ekspor Berhasil!",
          description: "Apakah Anda ingin menandai semua barang yang diekspor sebagai 'Selesai' (DONE) agar masuk ke riwayat cetak suplier?",
          confirmText: "YA, SELESAI"
        });
        setIsConfirmDoneOpen(true);
      }, 500);
    } catch {
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkAllAsDone = async (skipConfirm = false) => {
    if (skipConfirm) {
      executeMarkAllAsDone();
    } else {
      setConfirmDoneConfig({
        title: "Selesaikan Antrean?",
        description: "Apakah Anda yakin ingin menandai SEMUA antrean dari supplier sebagai 'Selesai'?",
        confirmText: "YA, SELESAI"
      });
      setIsConfirmDoneOpen(true);
    }
  };

  const executeMarkAllAsDone = async () => {
    try {
      const res = await fetch("/api/print-queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, status: "DONE" })
      });
      if (res.ok) {
        toast.success("Semua antrean berhasil ditandai selesai");
        fetchQueue();
        setHistoryKey(prev => prev + 1);
      } else {
        toast.error("Gagal memperbarui status antrean");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    }
  };

  const handleUpdateQueueQty = async (id: string, qty: number) => {
    try {
      await fetch("/api/print-queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, qty })
      });
      fetchQueue();
    } catch {
      toast.error("Gagal memperbarui jumlah");
    }
  };

  const handleAdminAddItem = async (product: Product) => {
    try {
      const res = await fetch("/api/print-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          name: product.name,
          code: product.code,
          qty: 1,
          supplierId: product.supplierId
        }])
      });
      if (res.ok) {
        toast.success(`Berhasil menambahkan ${product.name}`);
        setSearchTerm("");
        fetchQueue();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menambahkan");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    }
  };

  const handleMarkAsDone = async (id: string) => {
    try {
      await fetch("/api/print-queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "DONE" })
      });
      fetchQueue();
      setHistoryKey(prev => prev + 1);
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleDeleteQueueItem = async (id: string) => {
    try {
      const res = await fetch("/api/print-queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        toast.success("Barang antrean berhasil dihapus");
        fetchQueue();
      } else {
        toast.error("Gagal menghapus barang antrean");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    }
  };

  const handleClearQueue = async () => {
    try {
      await fetch("/api/print-queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      fetchQueue();
      toast.success("Antrean dibersihkan");
      setIsClearQueueDialogOpen(false);
    } catch {
      toast.error("Gagal membersihkan antrean");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-10">
      <CetakHeader 
        userRole={userRole}
        isSavingQueue={isSavingQueue}
        isExporting={isExporting}
        onSaveQueue={handleSaveQueue}
        onExport={handleExportQueue}
        hasSelected={selectedItems.length > 0}
        hasQueue={queueItems.length > 0}
      />

      <CetakProductSearch 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredProducts={filteredProducts}
        onAddItem={userRole === "ADMIN" ? handleAdminAddItem : addItem}
        placeholder={userRole === "ADMIN" ? "Cari barang tambahan..." : "Cari barang yang ingin dicetak..."}
      />

      {userRole === "ADMIN" && (
        <CetakQueueList 
          queueItems={queueItems}
          isQueueLoading={isQueueLoading}
          onRefresh={fetchQueue}
          onClear={() => setIsClearQueueDialogOpen(true)}
          onAddFromQueue={(item) => addFromQueue(item, codeLookupMap)}
          onMarkAsDone={handleMarkAsDone}
          onMarkAllDone={() => handleMarkAllAsDone(false)}
          onUpdateQty={handleUpdateQueueQty}
          onDeleteQueueItem={handleDeleteQueueItem}
        />
      )}

      {userRole === "ADMIN" && (
        <AdminPrintHistory key={historyKey} />
      )}

      {userRole === "SUPPLIER" && (
        <CetakSelectedTable 
          items={sortedSelectedItems}
          onUpdateQty={updateQty}
          onRemoveItem={removeItem}
          userRole={userRole}
        />
      )}

      {userRole === "SUPPLIER" && (
        <SupplierPrintHistory key={historyKey} />
      )}

      {userRole === "SUPPLIER" && <CetakPrintView items={sortedSelectedItems} />}

      <ClearQueueDialog 
        isOpen={isClearQueueDialogOpen}
        onOpenChange={setIsClearQueueDialogOpen}
        onConfirm={handleClearQueue}
      />

      <ConfirmDoneDialog 
        isOpen={isConfirmDoneOpen}
        onOpenChange={setIsConfirmDoneOpen}
        onConfirm={executeMarkAllAsDone}
        title={confirmDoneConfig.title}
        description={confirmDoneConfig.description}
        confirmText={confirmDoneConfig.confirmText}
      />
    </div>
  );
}
