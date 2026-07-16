import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface MasterProductsTableProps {
  products: any[];
  loading: boolean;
}

export function MasterProductsTable({
  products,
  loading,
}: MasterProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const query = searchTerm.toLowerCase();
    return products.filter((p) => {
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesCode = p.code && p.code.toLowerCase().includes(query);
      const matchesSupplier = p.supplier && p.supplier.name.toLowerCase().includes(query);
      return matchesName || matchesCode || matchesSupplier;
    });
  }, [products, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border bg-muted/30 py-5 px-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Daftar Semua Produk</h3>
          <p className="text-muted-foreground text-xs md:text-sm">Melihat semua daftar produk master terdaftar beserta supliernya.</p>
        </div>
        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-400 transition-colors" />
          <Input 
            placeholder="Cari nama, kode, atau supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-white/5 border-white/5 rounded-lg focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/2">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 w-12 text-center">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 w-40">Kode Produk</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Nama Produk</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Supplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat data produk...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16 text-slate-500 font-medium italic">
                  {searchTerm ? "Tidak ada produk yang cocok dengan pencarian." : "Belum ada data produk terdaftar."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow key={product.id} className="border-white/5 hover:bg-white/2 transition-colors group">
                  <TableCell className="text-slate-500 font-bold py-3.5 text-center">{index + 1}</TableCell>
                  <TableCell className="text-slate-400 font-mono font-medium text-xs py-3.5">
                    {product.code || "-"}
                  </TableCell>
                  <TableCell className="text-slate-200 font-bold text-sm py-3.5">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-slate-400 font-bold text-[11px] uppercase tracking-tighter py-3.5">
                    {product.supplier?.name || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
