import { Loader2, AlertCircle, Trash2, Scissors } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeductionRow } from "@/app/(dashboard)/potongan/input/hooks/use-potongan-data";
import { useCallback, memo } from "react";

interface PotonganTableProps {
  loading: boolean;
  rows: DeductionRow[];
  onUpdateField: (supplierId: string, field: "serviceCharge" | "kukuluban", value: string) => void;
  onDeleteRow?: (supplierId: string) => void;
}

interface PotonganTableRowProps {
  row: DeductionRow;
  onUpdateField: (supplierId: string, field: "serviceCharge" | "kukuluban", value: string) => void;
  onDeleteRow?: (supplierId: string) => void;
  handleTableKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, field: string) => void;
}

const MemoizedRow = memo(
  function PotonganTableRow({ row, onUpdateField, onDeleteRow, handleTableKeyDown }: PotonganTableRowProps) {
    const totalPotongan = row.serviceCharge + row.kukuluban;
    const netMitra = row.baseProfit80 - (row.serviceCharge + row.kukuluban + row.tabungan);
    const visibleNotes = row.noteNumbers.slice(0, 3);
    const hiddenCount = row.noteNumbers.length - visibleNotes.length;

    return (
      <TableRow className="border-white/5 hover:bg-white/[0.02] transition-all group">
        {/* Kolom 1: Suplier & Nota */}
        <TableCell className="py-4 px-6 min-w-[200px]">
          <div className="flex flex-col gap-1">
            <span className="font-black text-white uppercase tracking-tight group-hover:text-rose-400 transition-colors text-base">
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
        <TableCell className="py-4 px-6 text-right font-bold text-slate-300 min-w-[130px] text-base">
          {new Intl.NumberFormat("id-ID").format(row.totalCost)}
        </TableCell>

        {/* Kolom 3: Service Charge */}
        <TableCell className="py-4 px-6 text-right min-w-[160px]">
          <div className="flex flex-col items-end gap-1.5">
            <Input
              type="text"
              value={row.serviceCharge === 0 ? "" : new Intl.NumberFormat("id-ID").format(row.serviceCharge)}
              placeholder="0"
              onChange={(e) => onUpdateField(row.supplierId, "serviceCharge", e.target.value)}
              onKeyDown={(e) => handleTableKeyDown(e, "serviceCharge")}
              className="bg-background border-border text-right font-black text-foreground focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 h-11 w-36 rounded-xl px-3 transition-all text-base"
            />
            {row.existingServiceCharge > 0 && (
              <span className="text-[11px] font-semibold text-rose-400/80 pr-1">
                Tercatat: Rp {new Intl.NumberFormat("id-ID").format(row.existingServiceCharge)}
              </span>
            )}
          </div>
        </TableCell>

        {/* Kolom 4: Kukuluban */}
        <TableCell className="py-4 px-6 text-right min-w-[160px]">
          <div className="flex flex-col items-end gap-1.5">
            <Input
              type="text"
              value={row.kukuluban === 0 ? "" : new Intl.NumberFormat("id-ID").format(row.kukuluban)}
              placeholder="0"
              onChange={(e) => onUpdateField(row.supplierId, "kukuluban", e.target.value)}
              onKeyDown={(e) => handleTableKeyDown(e, "kukuluban")}
              className="bg-background border-border text-right font-black text-foreground focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 h-11 w-36 rounded-xl px-3 transition-all text-base"
            />
            {row.existingKukuluban > 0 && (
              <span className="text-[11px] font-semibold text-orange-400/80 pr-1">
                Tercatat: Rp {new Intl.NumberFormat("id-ID").format(row.existingKukuluban)}
              </span>
            )}
          </div>
        </TableCell>

        {/* Kolom 5: Total Potongan */}
        <TableCell className="py-4 px-6 text-right font-bold text-rose-400 min-w-[140px] text-base">
          {new Intl.NumberFormat("id-ID").format(totalPotongan)}
        </TableCell>

        {/* Kolom 6: Net Mitra */}
        <TableCell className="py-4 px-6 text-right font-black text-emerald-400 text-lg min-w-[150px]">
          {new Intl.NumberFormat("id-ID").format(netMitra)}
        </TableCell>

        {/* Kolom 7: Aksi */}
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

export function PotonganTable({ loading, rows, onUpdateField, onDeleteRow }: PotonganTableProps) {
  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
      const fields = ["serviceCharge", "kukuluban"];
      const fieldIndex = fields.indexOf(field);

      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (fieldIndex < fields.length - 1) {
          const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input");
          nextInput?.focus();
        } else {
          const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
          const targetInput = nextRow?.querySelectorAll("td")[2]?.querySelector("input");
          if (targetInput) (targetInput as HTMLElement).focus();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (fieldIndex > 0) {
          const prevInput = e.currentTarget.closest("td")?.previousElementSibling?.querySelector("input");
          prevInput?.focus();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
        const targetInput = nextRow?.querySelectorAll("td")[fieldIndex + 2]?.querySelector("input");
        if (targetInput) (targetInput as HTMLElement).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevRow = e.currentTarget.closest("tr")?.previousElementSibling;
        const targetInput = prevRow?.querySelectorAll("td")[fieldIndex + 2]?.querySelector("input");
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
            <TableHead className="py-5 px-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground min-w-[200px]">Suplier & Nota</TableHead>
            <TableHead className="py-5 px-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 min-w-[130px]">Total Cost</TableHead>
            <TableHead className="py-5 px-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-rose-400 min-w-[160px]">S.Charge</TableHead>
            <TableHead className="py-5 px-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-orange-400 min-w-[160px]">Kukuluban</TableHead>
            <TableHead className="py-5 px-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-rose-400 min-w-[140px]">Total Pot.</TableHead>
            <TableHead className="py-5 px-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-emerald-400 min-w-[150px]">Net Mitra</TableHead>
            <TableHead className="py-5 px-4 text-center font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 w-16">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-24">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                  <span className="font-medium">Mengkalkulasi data per suplier...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-24 text-slate-500 font-medium italic">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-slate-700" />
                  Tidak ada transaksi ditemukan pada periode ini.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
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
