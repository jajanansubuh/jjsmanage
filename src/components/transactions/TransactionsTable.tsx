import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionRow } from "./TransactionRow";

interface TransactionsTableProps {
  rows: any[];
  suppliers: any[];
  onUpdateField: (id: string, field: any, val: string) => void;
  onKeyDown: (e: any, idx: number, field: string) => void;
  onRemoveRow: (idx: number) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  totals: any;
}

export function TransactionsTable({
  rows,
  suppliers,
  onUpdateField,
  onKeyDown,
  onRemoveRow,
  sortOrder,
  onToggleSort,
  totals
}: TransactionsTableProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/5 bg-white/[0.02]">
              <TableHead className="w-12 text-center py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No</TableHead>
              <TableHead className="py-5">
                <Button variant="ghost" onClick={onToggleSort} className="p-0 h-auto font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-transparent hover:text-white flex items-center gap-2">
                  Nama Suplier <ArrowUpDown className="w-3 h-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Pendapatan</TableHead>
              <TableHead className="text-right py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Cost</TableHead>
              <TableHead className="text-right py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Barcode</TableHead>
              <TableHead className="text-right py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Mitra Jjs</TableHead>
              <TableHead className="text-right py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Toko</TableHead>
              <TableHead className="w-12 py-5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                    <p className="text-sm font-medium italic">Belum ada transaksi yang ditambahkan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TransactionRow
                  key={row.id}
                  row={row}
                  index={index}
                  suppliers={suppliers}
                  onUpdateField={onUpdateField}
                  onKeyDown={onKeyDown}
                  onRemove={onRemoveRow}
                />
              ))
            )}

            {/* Total Row */}
            {rows.length > 0 && (
              <TableRow className="bg-slate-950/60 border-t-2 border-white/10 font-bold print:bg-gray-100">
                <TableCell colSpan={2} className="text-center text-[9px] font-black tracking-[0.1em] uppercase py-6 print:text-black text-slate-400 px-2">Total</TableCell>
                <TableCell className="text-right text-base font-black text-white py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.revenue)}</TableCell>
                <TableCell className="text-right text-sm font-bold text-white/40 py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.cost)}</TableCell>
                <TableCell className="text-right text-sm font-bold text-white/40 py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.barcode)}</TableCell>
                <TableCell className="text-right text-base font-black text-blue-400/80 py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.profit80)}</TableCell>
                <TableCell className="text-right text-lg font-black text-emerald-400 py-6 px-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{new Intl.NumberFormat("id-ID").format(totals.profit20)}</TableCell>
                <TableCell className="no-print px-2"></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
