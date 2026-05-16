"use client";

import { useState, useEffect } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { FileText, Wallet, Coins, History, Package } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Hooks & Utils
import { useReports } from "./hooks/use-reports";
import { exportReportsToExcel } from "@/lib/export-utils";
import { getTransactionPrintTemplate, getDeductionPrintTemplate, getSavingsPrintTemplate } from "@/lib/print-templates";

// Components
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { TransactionTab } from "@/components/reports/TransactionTab";
import { DepositTab } from "@/components/reports/DepositTab";
import { SavingsTab } from "@/components/reports/SavingsTab";
import { DeductionTab } from "@/components/reports/DeductionTab";
import { ProductTab } from "@/components/reports/ProductTab";

// Dialogs
import { TransactionDetailDialog } from "@/components/reports/TransactionDetailDialog";
import { DeleteConfirmDialog } from "@/components/reports/DeleteConfirmDialog";
import { ProductDetailDialog } from "@/components/reports/ProductDetailDialog";
import { SavingsDetailDialog } from "@/components/reports/SavingsDetailDialog";
import { SupplierSetoranDetailDialog } from "@/components/reports/SupplierSetoranDetailDialog";

export default function ReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("transaksi");

  const {
    loading,
    userRole,
    reports,
    searchTerm,
    setSearchTerm,
    payoutSearch,
    setPayoutSearch,
    savingsSearch,
    setSavingsSearch,
    deductionSearch,
    setDeductionSearch,
    produkSearch,
    setProdukSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredReports,
    validatedDeposits,
    validatedSuppliers,
    groupedSavingsByNote,
    filteredDeductions,
    groupedProductsByNote,
    fetchData
  } = useReports();

  // Dialog States
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [noteDetails, setNoteDetails] = useState<any[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDeductionModal, setIsDeductionModal] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteNoteNumber, setDeleteNoteNumber] = useState<string | null>(null);
  const [deleteCredentials, setDeleteCredentials] = useState({ username: "", password: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [isTabunganModalOpen, setIsTabunganModalOpen] = useState(false);
  const [selectedTabunganNote, setSelectedTabunganNote] = useState<any>(null);

  const [isProdukModalOpen, setIsProdukModalOpen] = useState(false);
  const [selectedProdukNote, setSelectedProdukNote] = useState<any>(null);

  const [isSupplierSetoranModalOpen, setIsSupplierSetoranModalOpen] = useState(false);
  const [selectedSupplierForSetoran, setSelectedSupplierForSetoran] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExport = () => {
    let dataToExport = [];
    if (activeTab === "transaksi") dataToExport = filteredReports;
    else if (activeTab === "setoran") dataToExport = validatedSuppliers;
    else if (activeTab === "tabungan") dataToExport = groupedSavingsByNote;
    else if (activeTab === "potongan") dataToExport = filteredDeductions;
    else if (activeTab === "produk") dataToExport = groupedProductsByNote;
    
    exportReportsToExcel(activeTab, dataToExport);
  };

  const handleDelete = async () => {
    if (!deleteNoteNumber || !deleteCredentials.username || !deleteCredentials.password) {
      setDeleteError("Harap isi username dan password");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/reports/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteNumber: deleteNoteNumber,
          username: deleteCredentials.username,
          password: deleteCredentials.password
        })
      });
      if (res.ok) {
        toast.success("Transaksi berhasil dihapus");
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        const result = await res.json();
        setDeleteError(result.error || "Gagal menghapus");
      }
    } catch (err) {
      setDeleteError("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReprint = (type: 'transaction' | 'deduction' | 'savings') => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let content = "";
    if (type === 'transaction') {
      const first = noteDetails[0];
      const reportDate = first.deductionDate || first.date || first.createdAt;
      content = getTransactionPrintTemplate(selectedNote!, reportDate, noteDetails);
    } else if (type === 'deduction') {
      const first = noteDetails[0];
      const reportDate = first.deductionDate || first.date || first.createdAt;
      content = getDeductionPrintTemplate(selectedNote!, reportDate, noteDetails);
    } else if (type === 'savings') {
      content = getSavingsPrintTemplate(selectedTabunganNote);
    }

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10">
      <ReportsHeader onExport={handleExport} />

      <Tabs defaultValue="transaksi" className="space-y-8" onValueChange={(val) => val && setActiveTab(val)}>
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <TabsList className="bg-slate-900/50 border border-white/5 p-2 rounded-[2rem] h-16 md:h-20 w-max flex items-center gap-2 min-w-full">
            <LayoutGroup id="reports-nav">
              {[
                { id: "transaksi", label: "Transaksi", icon: FileText, color: "#2563eb", shadow: "shadow-blue-900/50" },
                { id: "setoran", label: "Setoran", icon: Wallet, color: "#4f46e5", shadow: "shadow-indigo-900/50" },
                { id: "tabungan", label: "Tabungan", icon: Coins, color: "#9333ea", shadow: "shadow-purple-900/50" },
                { id: "potongan", label: "Potongan", icon: History, color: "#e11d48", shadow: "shadow-rose-900/50" },
                { id: "produk", label: "Produk", icon: Package, color: "#059669", shadow: "shadow-emerald-900/50" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`relative !py-4 px-6 md:px-8 rounded-2xl font-black text-sm md:text-base transition-colors duration-200 whitespace-nowrap overflow-visible data-[state=active]:!bg-transparent data-[state=inactive]:!bg-transparent ${
                    activeTab === tab.id ? "!text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className={`absolute inset-0 rounded-2xl shadow-xl ${tab.shadow}`}
                      style={{ backgroundColor: tab.color }}
                      animate={{ backgroundColor: tab.color }}
                      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    <tab.icon className="w-5 h-5 mr-2" /> {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </LayoutGroup>
          </TabsList>
        </div>

        <TabsContent value="transaksi" className="space-y-8">
          {activeTab === "transaksi" && (
            <TransactionTab 
              loading={loading}
              userRole={userRole}
              filteredReports={filteredReports}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onSelectNote={(note) => {
                setSelectedNote(note);
                setIsNoteModalOpen(true);
                setIsDeductionModal(false);
                setNoteDetails(reports.filter(item => item.noteNumber === note));
              }}
              onDeleteNote={(note) => {
                setDeleteNoteNumber(note);
                setIsDeleteModalOpen(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="setoran" className="space-y-8">
          {activeTab === "setoran" && (
            <DepositTab 
              validatedDeposits={validatedDeposits}
              payoutSearch={payoutSearch}
              setPayoutSearch={setPayoutSearch}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
          )}
        </TabsContent>

        <TabsContent value="tabungan" className="space-y-8">
          {activeTab === "tabungan" && (
            <SavingsTab 
              groupedSavingsByNote={groupedSavingsByNote}
              savingsSearch={savingsSearch}
              setSavingsSearch={setSavingsSearch}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onSelectSavings={(s) => {
                setSelectedTabunganNote({
                  noteNumber: s.noteNumber || "-",
                  date: s.date,
                  suppliers: Array.from(s.suppliers.values()).sort((a: any, b: any) => b.tabungan - a.tabungan)
                });
                setIsTabunganModalOpen(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="potongan" className="space-y-8">
          {activeTab === "potongan" && (
            <DeductionTab 
              filteredDeductions={filteredDeductions}
              deductionSearch={deductionSearch}
              setDeductionSearch={setDeductionSearch}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onSelectDeduction={(d) => {
                const targetNote = d.deductionNoteNumber || d.noteNumber;
                setSelectedNote(targetNote);
                setNoteDetails(reports.filter(item =>
                  item.noteNumber === targetNote ||
                  item.deductionNoteNumber === targetNote
                ));
                setIsNoteModalOpen(true);
                setIsDeductionModal(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="produk" className="space-y-8">
          {activeTab === "produk" && (
            <ProductTab 
              groupedProductsByNote={groupedProductsByNote}
              produkSearch={produkSearch}
              setProdukSearch={setProdukSearch}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onSelectProductNote={(g) => {
                setSelectedProdukNote({
                  noteNumber: g.noteNumber || "-",
                  products: Array.from(g.products.values()).sort((a: any, b: any) => b.totalJual - a.totalJual)
                });
                setIsProdukModalOpen(true);
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SupplierSetoranDetailDialog 
        isOpen={isSupplierSetoranModalOpen}
        onOpenChange={setIsSupplierSetoranModalOpen}
        selectedSupplier={selectedSupplierForSetoran}
      />

      <TransactionDetailDialog 
        isOpen={isNoteModalOpen}
        onOpenChange={setIsNoteModalOpen}
        selectedNote={selectedNote}
        noteDetails={noteDetails}
        userRole={userRole}
        isDeductionModal={isDeductionModal}
        onReprint={() => handleReprint(isDeductionModal ? 'deduction' : 'transaction')}
      />

      <ProductDetailDialog 
        isOpen={isProdukModalOpen}
        onOpenChange={setIsProdukModalOpen}
        selectedProdukNote={selectedProdukNote}
      />

      <SavingsDetailDialog 
        isOpen={isTabunganModalOpen}
        onOpenChange={setIsTabunganModalOpen}
        selectedTabunganNote={selectedTabunganNote}
        userRole={userRole}
        onReprint={() => handleReprint('savings')}
      />

      <DeleteConfirmDialog 
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        deleteNoteNumber={deleteNoteNumber}
        deleteCredentials={deleteCredentials}
        setDeleteCredentials={setDeleteCredentials}
        deleteError={deleteError}
        isDeleting={isDeleting}
        onDelete={handleDelete}
      />
    </div>
  );
}
