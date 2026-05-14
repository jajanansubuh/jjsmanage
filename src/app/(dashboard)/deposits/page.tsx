"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

// Hooks
import { useDepositsData, DepositItem } from "./hooks/use-deposits-data";

// Components
import { DepositsSupplierSummary } from "@/components/deposits/DepositsSupplierSummary";
import { DepositsFilters } from "@/components/deposits/DepositsFilters";
import { DepositsTable } from "@/components/deposits/DepositsTable";
import { ConfirmValidateDialog } from "@/components/deposits/ConfirmValidateDialog";
import { PayoutHistoryModal } from "@/components/payout-history-modal";

// Utils
import { handlePrintDeposits } from "@/components/deposits/DepositsPrintPreview";

export default function DepositsPage() {
  // State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [bankFilter, setBankFilter] = useState<string>("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof DepositItem; direction: "asc" | "desc" } | null>({ key: "dailyProfit", direction: "desc" });
  
  // Modals state
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string, name: string } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isConfirmAllOpen, setIsConfirmAllOpen] = useState(false);
  const [unvalidatedIds, setUnvalidatedIds] = useState<string[]>([]);
  const [isValidatingAll, setIsValidatingAll] = useState(false);

  // Data fetching
  const { data, loading, role } = useDepositsData(dateRange);

  // Filtering and Sorting
  const filteredAndSortedData = useMemo(() => {
    let result = [...data].filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (bankFilter === "CASH") {
        const name = (s.bankName || "").toUpperCase();
        return name === "" || name === "CASH" || name === "TUNAI" || name === "-";
      }

      if (bankFilter === "BANK") {
        const name = (s.bankName || "").toUpperCase();
        return name !== "" && name !== "CASH" && name !== "TUNAI" && name !== "-";
      }

      return true;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB, 'id', { sensitivity: 'base' })
            : valB.localeCompare(valA, 'id', { sensitivity: 'base' });
        }

        const numA = Number(valA);
        const numB = Number(valB);

        if (isNaN(numA) || isNaN(numB)) {
          const strA = String(valA);
          const strB = String(valB);
          return sortConfig.direction === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }

        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, bankFilter]);

  // Handlers
  const handleSort = (key: keyof DepositItem) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleValidateAllClick = () => {
    const ids = filteredAndSortedData
      .filter(item => !item.isValidated)
      .map(item => item.id);

    if (ids.length === 0) {
      alert("Tidak ada data yang perlu divalidasi.");
      return;
    }
    setUnvalidatedIds(ids);
    setIsConfirmAllOpen(true);
  };

  const executeValidateAll = async () => {
    setIsValidatingAll(true);
    try {
      const res = await fetch("/api/reports/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierIds: unvalidatedIds,
          startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Gagal memvalidasi setoran massal.");
        setIsValidatingAll(false);
        setIsConfirmAllOpen(false);
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
      setIsValidatingAll(false);
      setIsConfirmAllOpen(false);
    }
  };

  const handleValidateSingle = async (id: string) => {
    try {
      const res = await fetch("/api/reports/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: id,
          startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        }),
      });
      if (res.ok) window.location.reload();
      else alert("Gagal memvalidasi.");
    } catch (e) { alert("Kesalahan sistem."); }
  };

  const handleViewDetails = (item: any) => {
    const s = item.supplier || item;
    setSelectedSupplier({ id: s.id, name: s.name });
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10 px-0 md:px-0">
      
      {/* Modals */}
      <ConfirmValidateDialog
        isOpen={isConfirmAllOpen}
        onOpenChange={setIsConfirmAllOpen}
        isValidatingAll={isValidatingAll}
        unvalidatedIdsCount={unvalidatedIds.length}
        onConfirm={executeValidateAll}
      />

      <PayoutHistoryModal
        isOpen={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        supplierId={selectedSupplier?.id}
        supplierName={selectedSupplier?.name}
      />

      {/* Header */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            Info <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">{role === "SUPPLIER" ? "Saldo" : "Penyetoran"}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl">
            {role === "SUPPLIER" ? "Rekapitulasi saldo pendapatan Anda yang sudah dicairkan." : "Rekapitulasi transaksi harian yang siap disetorkan ke Mitra Jjs. Gunakan filter untuk melihat data spesifik."}
          </p>
        </div>

        {/* Supplier Summary Card */}
        {role === "SUPPLIER" && data.length > 0 && (
          <DepositsSupplierSummary data={data} />
        )}

        {/* Filters & Controls */}
        <DepositsFilters 
          role={role}
          dateRange={dateRange}
          setDateRange={setDateRange}
          bankFilter={bankFilter}
          setBankFilter={setBankFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredAndSortedData={filteredAndSortedData}
          onValidateAllClick={handleValidateAllClick}
          onPrintClick={() => handlePrintDeposits(filteredAndSortedData, dateRange, role, bankFilter)}
        />
      </div>

      {/* Main Content Table */}
      <DepositsTable 
        filteredAndSortedData={filteredAndSortedData}
        loading={loading}
        role={role}
        sortConfig={sortConfig}
        onSort={handleSort}
        onViewDetails={handleViewDetails}
        onValidate={handleValidateSingle}
      />
    </div>
  );
}
