import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/types/cetak";
import { useState, useRef, useEffect } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative group no-print">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
      <Input
        placeholder={placeholder}
        className="pl-12 pr-4 h-14 bg-card/40 border border-white/5 rounded-2xl focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 font-medium text-white text-sm md:text-lg placeholder-slate-500"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      
      {isOpen && searchTerm && (
        <Card className="absolute top-full left-0 right-0 mt-3 z-50 bg-card/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="p-5 text-center text-slate-500 italic text-sm">Produk tidak ditemukan</div>
            ) : (
              filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => {
                    onAddItem(product);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all duration-200 text-left border-b border-white/5 last:border-0 group/item cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-white group-hover/item:text-emerald-400 transition-colors uppercase">{product.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                      <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{product.code || "TANPA KODE"}</span>
                      <span className="text-slate-400 font-semibold">{product.supplierName || product.supplier?.name || "Tanpa Suplier"}</span>
                    </p>
                  </div>
                  <Package className="w-4 h-4 text-slate-500 group-hover/item:text-emerald-400 group-hover/item:scale-110 transition-all duration-200" />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

