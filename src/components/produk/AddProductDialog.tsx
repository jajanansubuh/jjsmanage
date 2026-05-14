import { useState } from "react";
import { PlusCircle, Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: { id: string; name: string }[];
  onSuccess: () => void;
}

export function AddProductDialog({
  isOpen,
  onOpenChange,
  suppliers,
  onSuccess
}: AddProductDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [form, setForm] = useState({ name: "", code: "", supplierId: "" });

  const handleAddProduct = async () => {
    if (!form.name.trim()) {
      toast.error("Nama barang wajib diisi");
      return;
    }
    if (!form.supplierId) {
      toast.error("Pilih suplier terlebih dahulu");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim().toUpperCase(),
          code: form.code.trim() || undefined,
          supplierId: form.supplierId,
        }),
      });
      if (res.ok) {
        toast.success("Produk berhasil ditambahkan");
        setForm({ name: "", code: "", supplierId: "" });
        onOpenChange(false);
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menambahkan produk");
      }
    } catch {
      toast.error("Gagal menambahkan produk");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 text-white backdrop-blur-3xl shadow-2xl rounded-[2.5rem] p-0 max-w-md overflow-hidden gap-0">
        <div className="p-8 pb-4">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span>Tambah <span className="text-emerald-400">Produk</span></span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Suplier *</label>
              <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                <PopoverTrigger 
                  className="w-full h-12 px-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white text-sm font-bold flex items-center justify-between hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                >
                  <span className="truncate">
                    {suppliers.find(s => s.id === form.supplierId)?.name || "-- Pilih Suplier --"}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-200", isSupplierPopoverOpen && "rotate-180")} />
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0 bg-slate-900 border-white/10 text-white w-[var(--radix-popover-trigger-width)] z-[100] shadow-2xl rounded-2xl overflow-hidden"
                  align="start"
                  sideOffset={8}
                >
                  <div className="p-3 border-b border-white/5 bg-slate-950/30">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                      <Input 
                        placeholder="Cari suplier..." 
                        className="h-10 pl-9 bg-slate-900 border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar min-h-[100px]">
                    {suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 italic">
                        {suppliers.length === 0 ? "Memuat suplier..." : "Suplier tidak ditemukan"}
                      </div>
                    ) : (
                      suppliers
                        .filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                        .map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setForm(f => ({ ...f, supplierId: s.id }));
                              setIsSupplierPopoverOpen(false);
                              setSupplierSearch("");
                            }}
                            className={cn(
                              "w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all text-left",
                              form.supplierId === s.id 
                                ? "bg-emerald-500/10 text-emerald-400" 
                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span>{s.name}</span>
                            {form.supplierId === s.id && <Check className="w-3 h-3" />}
                          </button>
                        ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Nama Barang *</label>
              <Input
                placeholder="Contoh: Bacang Ayam"
                className="h-12 bg-slate-950/50 border-white/5 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all px-4"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Kode Barang</label>
              <Input
                placeholder="Contoh: BRG001 (opsional)"
                className="h-12 bg-slate-900/50 border-white/5 rounded-2xl text-white font-mono font-bold placeholder:text-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all px-4"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col gap-3">
          <Button
            className="w-full h-14 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-lg shadow-emerald-900/20 transition-all text-sm uppercase tracking-wider"
            onClick={handleAddProduct}
            disabled={isSaving}
          >
            {isSaving ? "Menyimpan..." : "Simpan Produk Baru"}
          </Button>
          <Button
            variant="ghost"
            className="w-full h-12 rounded-2xl font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all text-xs uppercase tracking-widest"
            onClick={() => { onOpenChange(false); setForm({ name: "", code: "", supplierId: "" }); }}
          >
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
