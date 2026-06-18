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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
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
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
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
              <TableRow className="bg-muted border-t-2 border-border font-bold">
                <TableCell colSpan={2} className="text-center text-[9px] font-black tracking-[0.1em] uppercase py-6 text-muted-foreground px-2">Total</TableCell>
                <TableCell className="text-right text-base font-black text-foreground py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.revenue)}</TableCell>
                <TableCell className="text-right text-sm font-bold text-muted-foreground py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.cost)}</TableCell>
                <TableCell className="text-right text-sm font-bold text-muted-foreground py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.barcode)}</TableCell>
                <TableCell className="text-right text-base font-black text-primary/80 py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.profit80)}</TableCell>
                <TableCell className="text-right text-lg font-black text-primary py-6 px-2">{new Intl.NumberFormat("id-ID").format(totals.profit20)}</TableCell>
                <TableCell className="no-print px-2"></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
