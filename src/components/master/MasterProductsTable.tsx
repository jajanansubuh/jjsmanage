import { useState, useMemo } from "react";
import { Search, GitMerge, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MergeProductDialog } from "./MergeProductDialog";

interface MasterProductsTableProps {
  products: any[];
  loading: boolean;
  onSuccess?: () => void;
}

type SortField = "name" | "code" | "supplier";
type SortOrder = "asc" | "desc";

export function MasterProductsTable({
  products,
  loading,
  onSuccess,
}: MasterProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const processedProducts = useMemo(() => {
    let list = [...products];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter((p) => {
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesCode = p.code && p.code.toLowerCase().includes(query);
        const matchesSupplier = p.supplier && p.supplier.name?.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesSupplier;
      });
    }

    if (sortField) {
      list.sort((a, b) => {
        let aVal = "";
        let bVal = "";

        if (sortField === "name") {
          aVal = a.name || "";
          bVal = b.name || "";
        } else if (sortField === "code") {
          aVal = a.code || "";
          bVal = b.code || "";
        } else if (sortField === "supplier") {
          aVal = a.supplier?.name || "";
          bVal = b.supplier?.name || "";
        }

        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [products, searchTerm, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-400 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-400 font-bold" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border bg-muted/30 py-5 px-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Daftar Semua Produk</h3>
          <p className="text-muted-foreground text-xs md:text-sm">Melihat semua daftar produk master terdaftar beserta supliernya.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Quick Sort Order Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="h-10 text-xs bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 font-medium px-3 rounded-lg gap-1.5 cursor-pointer"
            title="Toggle ASC / DESC"
          >
            {sortOrder === "asc" ? (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">ASC (A-Z)</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">DESC (Z-A)</span>
              </>
            )}
          </Button>

          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-400 transition-colors" />
            <Input 
              placeholder="Cari nama, kode, atau supplier..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-white/5 border-white/5 rounded-lg focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-xs"
            />
          </div>
          <Button
            onClick={() => setIsMergeDialogOpen(true)}
            variant="outline"
            className="w-full sm:w-auto bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 font-semibold text-xs h-10 rounded-lg gap-2"
          >
            <GitMerge className="w-4 h-4" />
            Merge Produk
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/2">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 w-12 text-center">No</TableHead>
              
              <TableHead 
                onClick={() => handleSort("code")}
                className="font-black text-[10px] uppercase tracking-widest text-slate-400 py-4 w-40 cursor-pointer select-none hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Kode Produk</span>
                  {renderSortIcon("code")}
                </div>
              </TableHead>
              
              <TableHead 
                onClick={() => handleSort("name")}
                className="font-black text-[10px] uppercase tracking-widest text-slate-400 py-4 cursor-pointer select-none hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Produk</span>
                  {renderSortIcon("name")}
                </div>
              </TableHead>

              <TableHead 
                onClick={() => handleSort("supplier")}
                className="font-black text-[10px] uppercase tracking-widest text-slate-400 py-4 cursor-pointer select-none hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Supplier</span>
                  {renderSortIcon("supplier")}
                </div>
              </TableHead>
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
            ) : processedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16 text-slate-500 font-medium italic">
                  {searchTerm ? "Tidak ada produk yang cocok dengan pencarian." : "Belum ada data produk terdaftar."}
                </TableCell>
              </TableRow>
            ) : (
              processedProducts.map((product, index) => (
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

      <MergeProductDialog
        isOpen={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        products={products}
        onSuccess={onSuccess}
      />
    </div>
  );
}


