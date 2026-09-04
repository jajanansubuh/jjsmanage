import { useState, useMemo } from "react";
import { Coins, Printer, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SavingsDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTabunganNote: any;
  userRole: string | null;
  onReprint: () => void;
}

export function SavingsDetailDialog({
  isOpen,
  onOpenChange,
  selectedTabunganNote,
  userRole,
  onReprint
}: SavingsDetailDialogProps) {
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<{ key: "name" | "cost" | "revenue" | "tabungan"; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc"
  });

  const handleSort = (key: "name" | "cost" | "revenue" | "tabungan") => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const sortedSuppliers = useMemo(() => {
    const suppliers = selectedTabunganNote?.suppliers || [];
    return [...suppliers].sort((a: any, b: any) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "cost" || sortConfig.key === "revenue") {
        valA = a.cost ?? a.revenue ?? 0;
        valB = b.cost ?? b.revenue ?? 0;
      }

      if (typeof valA === "string") {
        return sortConfig.direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortConfig.direction === "asc" ? valA - valB : valB - valA;
    });
  }, [selectedTabunganNote?.suppliers, sortConfig]);

  const getSortIcon = (key: "name" | "cost" | "revenue" | "tabungan") => {
    if (sortConfig.key !== key && !(key === "cost" && sortConfig.key === "revenue")) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-4xl max-w-4xl text-white flex flex-col max-h-[85vh] overflow-hidden p-0">
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Detail Tabungan:</span>
                  <span className="font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-xl text-base font-bold">
                    {selectedTabunganNote?.noteNumber}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  Rincian potongan tabungan per suplier untuk nomor nota ini.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-zinc-900/40">
            <Table>
              <TableHeader className="bg-zinc-900/90 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-b border-white/10">
                  <TableHead 
                    className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none group hover:text-white transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nama Suplier</span>
                      {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none group hover:text-white transition-colors"
                    onClick={() => handleSort("cost")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Cost</span>
                      {getSortIcon("cost")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-blue-400 cursor-pointer select-none group hover:text-blue-300 transition-colors"
                    onClick={() => handleSort("tabungan")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Potongan Tabungan</span>
                      {getSortIcon("tabungan")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSuppliers.map((s: any, idx: number) => (
                  <TableRow key={idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors duration-150">
                    <TableCell className="py-3 px-4 font-bold text-white text-sm">{s.name}</TableCell>
                    <TableCell className="py-3 px-4 text-right font-bold text-slate-300 tabular-nums">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.cost ?? s.revenue ?? 0)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-black text-blue-400 tabular-nums">
                      + {new Intl.NumberFormat("id-ID").format(s.tabungan)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3 shrink-0">
          {userRole !== "SUPPLIER" && (
            <>
              <Button
                onClick={onReprint}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-10 px-5 flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all border-0 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Ulang
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/savings/input?edit=${selectedTabunganNote?.noteNumber}`);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl h-10 px-5 flex items-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95 transition-all border-0 cursor-pointer"
              >
                <Pencil className="w-4 h-4" /> Edit Tabungan
              </Button>
            </>
          )}
          <Button 
            onClick={() => onOpenChange(false)} 
            className="bg-zinc-800 hover:bg-zinc-700 text-slate-200 hover:text-white font-bold rounded-xl h-10 px-6 border border-white/10 transition-all active:scale-95 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

