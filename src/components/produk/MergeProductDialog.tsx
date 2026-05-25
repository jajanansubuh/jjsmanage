import { useState, useEffect } from "react";
import { GitMerge, Loader2, Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { mergeProductsAction, syncProductsFromReportsAction } from "@/lib/actions/products";

interface Product {
  id: string;
  name: string;
  code?: string;
  supplierId: string;
}

interface MergeProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  suppliers?: { id: string; name: string }[];
}

export function MergeProductDialog({ isOpen, onOpenChange, onSuccess, suppliers = [] }: MergeProductDialogProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [fromSupplierId, setFromSupplierId] = useState("");
  const [toSupplierId, setToSupplierId] = useState("");
  const [isFromPopoverOpen, setIsFromPopoverOpen] = useState(false);
  const [fromSupplierSearch, setFromSupplierSearch] = useState("");
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [fromProducts, setFromProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isToPopoverOpen, setIsToPopoverOpen] = useState(false);
  const [toSupplierSearch, setToSupplierSearch] = useState("");

  const handleAutoSync = async () => {
    try {
      const result = await syncProductsFromReportsAction();
      if (!result.success) {
        console.warn("Auto-sync warning:", result.error);
      }
    } catch (error) {
      console.error("Auto-sync error:", error);
    }
  };

  // Auto-sync when dialog opens
  useEffect(() => {
    if (isOpen) {
      handleAutoSync();
    }
  }, [isOpen]);
  useEffect(() => {
    if (fromSupplierId) {
      setIsLoadingProducts(true);
      fetch(`/api/products?supplierId=${fromSupplierId}`)
        .then(res => res.json())
        .then(data => {
          setFromProducts(data || []);
          setProductId("");
          setProductName("");
        })
        .catch(() => {
          toast.error("Gagal memuat produk");
          setFromProducts([]);
        })
        .finally(() => setIsLoadingProducts(false));
    } else {
      setFromProducts([]);
      setProductId("");
      setProductName("");
    }
  }, [fromSupplierId]);

  const handleMerge = async () => {
    if (!productName.trim()) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }
    if (!fromSupplierId) {
      toast.error("Supplier asal harus dipilih");
      return;
    }
    if (!toSupplierId) {
      toast.error("Supplier tujuan harus dipilih");
      return;
    }
    if (fromSupplierId === toSupplierId) {
      toast.error("Supplier asal dan tujuan tidak boleh sama");
      return;
    }

    setIsMerging(true);
    try {
      const result = await mergeProductsAction({
        nameToMerge: productName,
        fromSupplierId,
        toSupplierId,
      });

      if ('success' in result && result.success) {
        toast.success(result.message);
        setProductId("");
        setProductName("");
        setFromSupplierId("");
        setToSupplierId("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error("Gagal merge produk");
      console.error(err);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl max-w-md p-8 shadow-2xl overflow-visible z-50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <GitMerge className="w-5 h-5 text-purple-400" />
            </div>
            <DialogTitle className="text-2xl font-black text-white">Gabung Produk</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 font-medium mt-2">
            Satukan produk dari satu supplier ke supplier lain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-6">
          {/* Supplier Asal */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Supplier Asal (yang akan dihapus)</label>
            <Popover open={isFromPopoverOpen} onOpenChange={setIsFromPopoverOpen}>
              <PopoverTrigger
                className="w-full h-12 px-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white text-sm font-bold flex items-center justify-between hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50"
              >
                <span className="truncate">{suppliers.find(s => s.id === fromSupplierId)?.name || "-- Pilih Supplier Asal --"}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-200", isFromPopoverOpen && "rotate-180")} />
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-slate-900 border-white/10 text-white w-[var(--radix-popover-trigger-width)] z-[100] shadow-2xl rounded-2xl overflow-hidden" align="start" sideOffset={8}>
                <div className="p-3 border-b border-white/5 bg-slate-950/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <Input placeholder="Cari supplier..." className="h-10 pl-9 bg-slate-900 border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-purple-500/20 focus:border-purple-500/50" value={fromSupplierSearch} onChange={(e) => setFromSupplierSearch(e.target.value)} />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar min-h-[100px]">
                  {suppliers.filter(s => s.name.toLowerCase().includes(fromSupplierSearch.toLowerCase())).length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 italic">{suppliers.length === 0 ? "Memuat supplier..." : "Supplier tidak ditemukan"}</div>
                  ) : (
                    suppliers.filter(s => s.name.toLowerCase().includes(fromSupplierSearch.toLowerCase())).map(s => (
                      <button key={s.id} onClick={() => { setFromSupplierId(s.id); setIsFromPopoverOpen(false); setFromSupplierSearch(""); }} className={cn("w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all text-left", fromSupplierId === s.id ? "bg-purple-500/10 text-purple-400" : "text-slate-300 hover:bg-white/5 hover:text-white")}> 
                        <span>{s.name}</span>
                        {fromSupplierId === s.id && <Check className="w-3 h-3" />}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Produk dari Supplier Asal */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Produk</label>
            <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
              <PopoverTrigger
                className={cn("w-full h-12 px-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white text-sm font-bold flex items-center justify-between hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50", !fromSupplierId && "opacity-50 cursor-not-allowed hover:bg-slate-950/50 hover:border-white/5")}
                disabled={!fromSupplierId}
              >
                <span className="truncate">{productName || "-- Pilih Produk --"}</span>
                {isLoadingProducts ? (
                  <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                ) : (
                  <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-200", isProductPopoverOpen && "rotate-180")} />
                )}
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-slate-900 border-white/10 text-white w-[var(--radix-popover-trigger-width)] z-[100] shadow-2xl rounded-2xl overflow-hidden" align="start" sideOffset={8}>
                <div className="p-3 border-b border-white/5 bg-slate-950/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <Input placeholder="Cari produk..." className="h-10 pl-9 bg-slate-900 border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-purple-500/20 focus:border-purple-500/50" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar min-h-[100px]">
                  {fromProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 italic">{fromProducts.length === 0 ? "Produk tidak ditemukan" : "Hasil pencarian kosong"}</div>
                  ) : (
                    fromProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                      <button key={p.id} onClick={() => { setProductId(p.id); setProductName(p.name); setIsProductPopoverOpen(false); setProductSearch(""); }} className={cn("w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all text-left", productId === p.id ? "bg-purple-500/10 text-purple-400" : "text-slate-300 hover:bg-white/5 hover:text-white")}> 
                        <div className="flex-1 truncate">
                          <div className="font-medium truncate">{p.name}</div>
                          {p.code && <div className="text-xs text-slate-500 truncate">Kode: {p.code}</div>}
                        </div>
                        {productId === p.id && <Check className="w-3 h-3 ml-2 flex-shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Supplier Tujuan */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Supplier Tujuan (yang akan dipertahankan)</label>
            <Popover open={isToPopoverOpen} onOpenChange={setIsToPopoverOpen}>
              <PopoverTrigger
                className="w-full h-12 px-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white text-sm font-bold flex items-center justify-between hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50"
              >
                <span className="truncate">{suppliers.find(s => s.id === toSupplierId)?.name || "-- Pilih Supplier Tujuan --"}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-200", isToPopoverOpen && "rotate-180")} />
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-slate-900 border-white/10 text-white w-[var(--radix-popover-trigger-width)] z-[100] shadow-2xl rounded-2xl overflow-hidden" align="start" sideOffset={8}>
                <div className="p-3 border-b border-white/5 bg-slate-950/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <Input placeholder="Cari supplier..." className="h-10 pl-9 bg-slate-900 border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-purple-500/20 focus:border-purple-500/50" value={toSupplierSearch} onChange={(e) => setToSupplierSearch(e.target.value)} />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar min-h-[100px]">
                  {suppliers.filter(s => s.name.toLowerCase().includes(toSupplierSearch.toLowerCase())).length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 italic">{suppliers.length === 0 ? "Memuat supplier..." : "Supplier tidak ditemukan"}</div>
                  ) : (
                    suppliers.filter(s => s.name.toLowerCase().includes(toSupplierSearch.toLowerCase())).map(s => (
                      <button key={s.id} onClick={() => { setToSupplierId(s.id); setIsToPopoverOpen(false); setToSupplierSearch(""); }} className={cn("w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all text-left", toSupplierId === s.id ? "bg-purple-500/10 text-purple-400" : "text-slate-300 hover:bg-white/5 hover:text-white")}> 
                        <span>{s.name}</span>
                        {toSupplierId === s.id && <Check className="w-3 h-3" />}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Info */}
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-left flex items-start gap-3">
            <div className="text-amber-400 mt-0.5">⚠️</div>
            <div className="text-xs text-amber-200 font-medium leading-relaxed">
              Produk dari supplier asal akan dihapus, dan semua transaksi akan dirujuk ke supplier tujuan.
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="flex-1 h-12 rounded-xl text-slate-400 font-bold hover:text-white hover:bg-white/5"
            disabled={isMerging}
          >
            Batal
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isMerging || !productId || !fromSupplierId || !toSupplierId}
            className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-lg shadow-purple-900/50 transition-all active:scale-95 disabled:opacity-50"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <GitMerge className="w-4 h-4 mr-2" />
                Gabung Produk
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
