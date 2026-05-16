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

// Dialogs
import { ClearQueueDialog } from "@/components/cetak/ClearQueueDialog";
import { normalizeName } from "@/app/(dashboard)/produk/hooks/use-products-data";

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
  } = usePrintSelection(userRole);

  const [isSavingQueue, setIsSavingQueue] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearQueueDialogOpen, setIsClearQueueDialogOpen] = useState(false);

  // Auto-populate for suppliers
  useEffect(() => {
    if (userRole === "SUPPLIER" && products.length > 0 && selectedItems.length === 0) {
      setSelectedItems(products.map(p => ({ ...p, qty: 1 })));
    }
  }, [userRole, products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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
          qty: item.qty
        })))
      });
      if (res.ok) {
        toast.success("Permintaan cetak berhasil dikirim ke Admin");
        setSelectedItems([]);
        fetchQueue();
      } else {
        toast.error("Gagal mengirim permintaan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSavingQueue(false);
    }
  };

  const handleExportQueue = () => {
    if (queueItems.length === 0) return;
    setIsExporting(true);
    try {
      const dataToExport: any[] = [];
      queueItems.forEach(item => {
        const row = {
          "Kode Barang": item.code || codeLookupMap[normalizeName(item.name)] || "",
          "Nama Barang": item.name,
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
    } catch (err) {
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
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
    } catch (err) {
      toast.error("Gagal memperbarui jumlah");
    }
  };

  const handleAdminAddItem = async (product: any) => {
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
    } catch (err) {
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
    } catch (err) {
      toast.error("Gagal memperbarui status");
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
    } catch (err) {
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
        onPrint={() => window.print()}
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
          onUpdateQty={handleUpdateQueueQty}
        />
      )}

      {userRole === "SUPPLIER" && (
        <CetakSelectedTable 
          items={sortedSelectedItems}
          onUpdateQty={updateQty}
          onRemoveItem={removeItem}
          userRole={userRole}
        />
      )}

      {userRole === "SUPPLIER" && <CetakPrintView items={sortedSelectedItems} />}

      <ClearQueueDialog 
        isOpen={isClearQueueDialogOpen}
        onOpenChange={setIsClearQueueDialogOpen}
        onConfirm={handleClearQueue}
      />
    </div>
  );
}
