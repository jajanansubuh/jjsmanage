import { Loader2, AlertCircle, Trash2, Coins, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SavingsRow } from "@/app/(dashboard)/savings/input/hooks/use-savings-data";
import { useState, useMemo, useCallback, memo } from "react";

interface SavingsInputTableProps {
  loading: boolean;
  rows: SavingsRow[];
  onUpdateField: (supplierId: string, value: string) => void;
  onDeleteRow?: (supplierId: string) => void;
}

interface SavingsInputTableRowProps {
  row: SavingsRow;
  onUpdateField: (supplierId: string, value: string) => void;
  onDeleteRow?: (supplierId: string) => void;
  handleTableKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const MemoizedRow = memo(
  function SavingsInputTableRow({ row, onUpdateField, onDeleteRow, handleTableKeyDown }: SavingsInputTableRowProps) {
    const netMitra = row.baseProfit80 - (row.serviceCharge + row.kukuluban + row.tabungan);
    const visibleNotes = row.noteNumbers.slice(0, 3);
    const hiddenCount = row.noteNumbers.length - visibleNotes.length;

    return (
      <TableRow className="border-white/5 hover:bg-white/[0.02] transition-all group">
        {/* Kolom 1: Nama Mitra & Nota */}
        <TableCell className="py-4 px-6 min-w-[220px]">
          <div className="flex flex-col gap-1">
            <span className="font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors text-base">
              {row.supplierName}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {visibleNotes.map((n) => (
                <span key={n} className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-tight">
                  {n}
                </span>
              ))}
              {hiddenCount > 0 && (
                <span 
                  className="text-[10px] font-bold text-slate-500 bg-white/[0.03] border border-white/5 px-1.5 py-0.5 rounded-md"
                  title={row.noteNumbers.slice(3).join(", ")}
                >
                  +{hiddenCount} nota
                </span>
              )}
            </div>
          </div>
        </TableCell>

        {/* Kolom 2: Total Cost */}
        <TableCell className="py-4 px-6 text-right font-bold text-slate-300 min-w-[140px] text-base">
          {new Intl.NumberFormat("id-ID").format(row.totalCost)}
        </TableCell>

        {/* Kolom 3: Input Nominal Tabungan */}
        <TableCell className="py-4 px-6 text-right min-w-[190px]">
          <div className="flex flex-col items-end gap-1.5">
            <Input
              type="text"
              value={row.tabungan === 0 ? "" : new Intl.NumberFormat("id-ID").format(row.tabungan)}
              placeholder="0"
              onChange={(e) => onUpdateField(row.supplierId, e.target.value)}
              onKeyDown={handleTableKeyDown}
              className="bg-background border-border text-right font-black text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 h-11 w-44 rounded-xl px-3 transition-all text-base"
            />
            {row.existingSavings > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400/90 pr-1">
                <Coins className="w-3 h-3 text-blue-400 shrink-0" />
                <span>Tercatat: Rp {new Intl.NumberFormat("id-ID").format(row.existingSavings)}</span>
              </div>
            )}
          </div>
        </TableCell>

        {/* Kolom 4: Net Mitra */}
        <TableCell className="py-4 px-6 text-right font-black text-emerald-400 text-lg min-w-[150px]">
          {new Intl.NumberFormat("id-ID").format(netMitra)}
        </TableCell>

        {/* Kolom 5: Aksi */}
        <TableCell className="py-4 px-4 text-center w-16">
          {onDeleteRow && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDeleteRow(row.supplierId)}
              className="h-9 w-9 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer opacity-60 group-hover:opacity-100"
              title="Hapus baris suplier ini"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => prevProps.row === nextProps.row
);

export function SavingsInputTable({ loading, rows, onUpdateField, onDeleteRow }: SavingsInputTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: "supplierName" | "totalCost" | "tabungan" | "netMitra";
    direction: "asc" | "desc";
  }>({
    key: "supplierName",
    direction: "asc",
  });

  const handleSort = (key: "supplierName" | "totalCost" | "tabungan" | "netMitra") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (sortConfig.key === "supplierName") {
        return sortConfig.direction === "asc"
          ? a.supplierName.localeCompare(b.supplierName)
          : b.supplierName.localeCompare(a.supplierName);
      }
      if (sortConfig.key === "netMitra") {
        const netA = a.baseProfit80 - (a.serviceCharge + a.kukuluban + a.tabungan);
        const netB = b.baseProfit80 - (b.serviceCharge + b.kukuluban + b.tabungan);
        return sortConfig.direction === "asc" ? netA - netB : netB - netA;
      }
      const valA = a[sortConfig.key] || 0;
      const valB = b[sortConfig.key] || 0;
      return sortConfig.direction === "asc" ? valA - valB : valB - valA;
    });
  }, [rows, sortConfig]);

  const getSortIcon = (key: "supplierName" | "totalCost" | "tabungan" | "netMitra") => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
    );
  };

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
        const targetInput = nextRow?.querySelectorAll("td")[2]?.querySelector("input");
        if (targetInput) (targetInput as HTMLElement).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevRow = e.currentTarget.closest("tr")?.previousElementSibling;
        const targetInput = prevRow?.querySelectorAll("td")[2]?.querySelector("input");
        if (targetInput) (targetInput as HTMLElement).focus();
      }
    },
    []
  );

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead 
              className="py-5 px-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground min-w-[220px] cursor-pointer select-none group hover:text-white transition-colors"
              onClick={() => handleSort("supplierName")}
            >
              <div className="flex items-center gap-1.5">
                <span>Nama Mitra & Nota</span>
                {getSortIcon("supplierName")}
              </div>
            </TableHead>
            <TableHead 
              className="py-5 px-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 min-w-[140px] cursor-pointer select-none group hover:text-white transition-colors"
              onClick={() => handleSort("totalCost")}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Total Cost</span>
                {getSortIcon("totalCost")}
              </div>
            </TableHead>
            <TableHead 
              className="py-5 px-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-blue-400 min-w-[190px] cursor-pointer select-none group hover:text-blue-300 transition-colors"
              onClick={() => handleSort("tabungan")}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Nominal Tabungan</span>
                {getSortIcon("tabungan")}
              </div>
            </TableHead>
            <TableHead 
              className="py-5 px-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-emerald-400 min-w-[150px] cursor-pointer select-none group hover:text-emerald-300 transition-colors"
              onClick={() => handleSort("netMitra")}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Net Mitra</span>
                {getSortIcon("netMitra")}
              </div>
            </TableHead>
            <TableHead className="py-5 px-4 text-center font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 w-16">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-24">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="font-medium">Mengkalkulasi data per suplier...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : sortedRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-24 text-slate-500 font-medium italic">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-slate-700" />
                  Tidak ada transaksi ditemukan pada periode ini.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedRows.map((row) => (
              <MemoizedRow
                key={row.supplierId}
                row={row}
                onUpdateField={onUpdateField}
                onDeleteRow={onDeleteRow}
                handleTableKeyDown={handleTableKeyDown}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
