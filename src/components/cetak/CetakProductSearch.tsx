import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/app/(dashboard)/cetak/hooks/use-cetak-data";

interface CetakProductSearchProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filteredProducts: Product[];
  onAddItem: (product: Product) => void;
  placeholder: string;
}

export function CetakProductSearch({
  searchTerm,
  setSearchTerm,
  filteredProducts,
  onAddItem,
  placeholder
}: CetakProductSearchProps) {
  return (
    <div className="relative group no-print">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
      <Input
        placeholder={placeholder}
        className="pl-12 pr-4 h-14 bg-slate-900/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium text-white text-sm md:text-lg"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {searchTerm && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border-white/10 shadow-2xl rounded-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-slate-500 italic">Produk tidak ditemukan</div>
            ) : (
              filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => onAddItem(product)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="font-bold text-white">{product.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{product.code || "Tanpa Kode"}</p>
                  </div>
                  <Package className="w-4 h-4 text-blue-400" />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
