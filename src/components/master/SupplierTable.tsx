import { ArrowUpDown, ArrowUp, ArrowDown, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface SupplierTableProps {
  filteredSuppliers: any[];
  loading: boolean;
  supplierSearch: string;
  supplierSortConfig: { key: string; direction: "asc" | "desc" } | null;
  requestSupplierSort: (key: string) => void;
  onSupplierClick: (s: any) => void;
  onManageClick: (s: any) => void;
}

export function SupplierTable({
  filteredSuppliers,
  loading,
  supplierSearch,
  supplierSortConfig,
  requestSupplierSort,
  onSupplierClick,
  onManageClick
}: SupplierTableProps) {

  const getSortIcon = (key: string) => {
    if (!supplierSortConfig || supplierSortConfig.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 inline-block text-slate-600" />;
    return supplierSortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3 inline-block text-blue-400" /> : <ArrowDown className="ml-2 h-3 w-3 inline-block text-blue-400" />;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-white/[0.02]">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead onClick={() => requestSupplierSort('name')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-8 cursor-pointer hover:text-white transition-colors group/th">
              Nama UMKM {getSortIcon('name')}
            </TableHead>
            <TableHead onClick={() => requestSupplierSort('ownerName')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 cursor-pointer hover:text-white transition-colors group/th">
              Pemilik {getSortIcon('ownerName')}
            </TableHead>
            <TableHead onClick={() => requestSupplierSort('bankName')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 cursor-pointer hover:text-white transition-colors group/th">
              Bank {getSortIcon('bankName')}
            </TableHead>
            <TableHead onClick={() => requestSupplierSort('accountNumber')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 cursor-pointer hover:text-white transition-colors group/th">
              No Rekening {getSortIcon('accountNumber')}
            </TableHead>
            <TableHead onClick={() => requestSupplierSort('balance')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right cursor-pointer hover:text-white transition-colors group/th">
              Pendapatan {getSortIcon('balance')}
            </TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-center">Status Akun</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-8 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7} className="text-center py-20"><div className="flex flex-col items-center gap-3 text-slate-500"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span>Memuat data...</span></div></TableCell></TableRow>
          ) : filteredSuppliers.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-20 text-slate-500 font-medium italic">{supplierSearch ? "Tidak ada suplier yang cocok dengan pencarian." : "Belum ada data suplier yang terdaftar."}</TableCell></TableRow>
          ) : (
            filteredSuppliers.map((s) => (
              <TableRow key={s.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell 
                  className="font-bold text-white py-4 px-8 group-hover:text-blue-400 transition-colors cursor-pointer"
                  onClick={() => onSupplierClick(s)}
                >
                  <div className="flex items-center gap-2">
                    {s.name}
                    <History className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </TableCell>
                <TableCell className="text-slate-400 font-medium">{s.ownerName || "-"}</TableCell>
                <TableCell className="text-slate-400 font-medium">{s.bankName || "-"}</TableCell>
                <TableCell className="font-mono text-sm text-slate-500 group-hover:text-slate-300 transition-colors">{s.accountNumber || "-"}</TableCell>
                <TableCell className="text-right font-black text-emerald-400 group-hover:scale-105 transition-transform origin-right">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(s.balance)}
                </TableCell>
                <TableCell className="text-center py-4">
                  {s.users && s.users.length > 0 ? (
                    s.users[0].isCredentialsChanged ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        Sudah Ganti
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider text-amber-400">
                        Belum Ganti
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Tanpa Akun
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right py-4 px-8">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-lg text-blue-400 hover:bg-blue-400/10 font-bold text-xs"
                    onClick={() => onManageClick(s)}
                  >
                    Kelola
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
