import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface CashierTableProps {
  filteredCashiers: any[];
  loading: boolean;
  cashierSearch: string;
  cashierSortConfig: { key: string; direction: "asc" | "desc" } | null;
  requestCashierSort: (key: string) => void;
}

export function CashierTable({
  filteredCashiers,
  loading,
  cashierSearch,
  cashierSortConfig,
  requestCashierSort
}: CashierTableProps) {

  const getSortIcon = (key: string) => {
    if (!cashierSortConfig || cashierSortConfig.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 inline-block text-slate-600" />;
    return cashierSortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3 inline-block text-purple-400" /> : <ArrowDown className="ml-2 h-3 w-3 inline-block text-purple-400" />;
  };

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => requestCashierSort('name')} className="cursor-pointer hover:text-primary transition-colors">
              Nama Kasir {getSortIcon('name')}
            </TableHead>
            <TableHead onClick={() => requestCashierSort('code')} className="cursor-pointer hover:text-primary transition-colors">
              Kode {getSortIcon('code')}
            </TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={3} className="text-center py-8">Memuat data...</TableCell></TableRow>
          ) : filteredCashiers.length === 0 ? (
            <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">{cashierSearch ? "Tidak ada kasir yang cocok dengan pencarian." : "Tidak ada data kasir."}</TableCell></TableRow>
          ) : (
            filteredCashiers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.code}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-purple-500">Edit</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
