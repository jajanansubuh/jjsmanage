import { Loader2, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DeductionRow } from "@/app/(dashboard)/potongan/hooks/use-potongan-data";
import { useCallback } from "react";

interface PotonganTableProps {
  loading: boolean;
  rows: DeductionRow[];
  onUpdateField: (supplierId: string, field: "serviceCharge" | "kukuluban" | "tabungan", value: string) => void;
}

export function PotonganTable({ loading, rows, onUpdateField }: PotonganTableProps) {
  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
      const fields = ["serviceCharge", "kukuluban", "tabungan"];
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
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader className="bg-white/[0.02]">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Suplier & Nota</TableHead>
            <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Total Cost</TableHead>
            <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-rose-400">S.Charge</TableHead>
            <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-orange-400">Kukuluban</TableHead>
            <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-purple-400">Tabungan</TableHead>
            <TableHead className="py-6 px-8 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-emerald-400">Net Mitra</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-24">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                  <span className="font-medium">Mengkalkulasi data per suplier...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-24 text-slate-500 font-medium italic">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-slate-700" />
                  Tidak ada transaksi ditemukan.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const netMitra = row.baseProfit80 - (row.serviceCharge + row.kukuluban + row.tabungan);
              return (
                <TableRow key={row.supplierId} className="border-white/5 hover:bg-white/[0.03] transition-all group">
                  <TableCell className="py-6 px-8">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-white uppercase tracking-tight group-hover:text-rose-400 transition-colors">{row.supplierName}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {row.noteNumbers.map((n) => (
                          <span key={n} className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-tighter">{n}</span>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-400">{new Intl.NumberFormat("id-ID").format(row.totalCost)}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="text"
                      value={row.serviceCharge === 0 ? "" : new Intl.NumberFormat("id-ID").format(row.serviceCharge)}
                      placeholder="0"
                      onChange={(e) => onUpdateField(row.supplierId, "serviceCharge", e.target.value)}
                      onKeyDown={(e) => handleTableKeyDown(e, "serviceCharge")}
                      className="bg-slate-950/30 border-white/5 text-right font-black text-rose-400 focus:bg-rose-500/10 focus:border-rose-500/50 focus:ring-0 h-10 w-28 ml-auto rounded-xl transition-all"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="text"
                      value={row.kukuluban === 0 ? "" : new Intl.NumberFormat("id-ID").format(row.kukuluban)}
                      placeholder="0"
                      onChange={(e) => onUpdateField(row.supplierId, "kukuluban", e.target.value)}
                      onKeyDown={(e) => handleTableKeyDown(e, "kukuluban")}
                      className="bg-slate-950/30 border-white/5 text-right font-black text-orange-400 focus:bg-orange-500/10 focus:border-orange-500/50 focus:ring-0 h-10 w-28 ml-auto rounded-xl transition-all"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="text"
                      value={row.tabungan === 0 ? "" : new Intl.NumberFormat("id-ID").format(row.tabungan)}
                      placeholder="0"
                      onChange={(e) => onUpdateField(row.supplierId, "tabungan", e.target.value)}
                      onKeyDown={(e) => handleTableKeyDown(e, "tabungan")}
                      className="bg-slate-950/30 border-white/5 text-right font-black text-purple-400 focus:bg-purple-500/10 focus:border-purple-500/50 focus:ring-0 h-10 w-28 ml-auto rounded-xl transition-all"
                    />
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right font-black text-emerald-400 text-lg">{new Intl.NumberFormat("id-ID").format(netMitra)}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
