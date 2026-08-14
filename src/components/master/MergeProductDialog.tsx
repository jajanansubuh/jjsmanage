"use client";

import { useState, useEffect, useRef } from "react";
import { GitMerge, AlertTriangle, ArrowRight, X, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductItem {
  id: string;
  name: string;
  code?: string | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
}

interface MergeProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductItem[];
  onSuccess?: () => void;
}

function getFormattedProductText(p: ProductItem) {
  const supplierStr = p.supplier?.name ? ` (Supplier: ${p.supplier.name})` : "";
  const codeStr = p.code ? ` [${p.code}]` : "";
  return `${p.name}${codeStr}${supplierStr}`;
}

function ProductSearchInput({
  label,
  placeholder,
  value,
  onChange,
  products,
  disabledId,
  zIndexClass = "z-20",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (id: string) => void;
  products: ProductItem[];
  disabledId?: string;
  zIndexClass?: string;
}) {
  const selectedProduct = products.find((p) => p.id === value);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProduct) {
      setQuery(getFormattedProductText(selectedProduct));
    } else {
      setQuery("");
    }
  }, [value, selectedProduct]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = products.filter((p) => {
    if (disabledId && p.id === disabledId) return false;
    if (!query.trim() || (selectedProduct && query === getFormattedProductText(selectedProduct))) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.supplier?.name && p.supplier.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`space-y-1.5 relative ${zIndexClass}`} ref={containerRef}>
      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (value) onChange("");
          }}
          className="h-10 text-xs bg-zinc-900 border-zinc-800 focus:border-emerald-500 pr-8 text-zinc-100 placeholder:text-zinc-500 rounded-xl"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange("");
              setIsOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar p-1">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-zinc-500 text-center">
              Tidak ada produk ditemukan
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onChange(p.id);
                  setQuery(getFormattedProductText(p));
                  setIsOpen(false);
                }}
                className={`p-2.5 text-xs rounded-lg cursor-pointer transition-colors flex flex-col gap-0.5 ${
                  p.id === value
                    ? "bg-emerald-500/20 text-emerald-400 font-semibold"
                    : "hover:bg-zinc-800 text-zinc-200 hover:text-white"
                }`}
              >
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-[11px] text-emerald-400/90 font-medium">
                  Supplier: <span className="text-white font-bold">{p.supplier?.name || "Tanpa Supplier"}</span>
                  {p.code ? <span className="text-zinc-400 ml-2">• Kode: {p.code}</span> : ""}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function MergeProductDialog({
  isOpen,
  onOpenChange,
  products,
  onSuccess,
}: MergeProductDialogProps) {
  const [sourceProductId, setSourceProductId] = useState<string>("");
  const [targetProductId, setTargetProductId] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);

  const sourceProduct = products.find((p) => p.id === sourceProductId);
  const targetProduct = products.find((p) => p.id === targetProductId);

  const handleMerge = async () => {
    if (!sourceProductId || !targetProductId) {
      toast.error("Pilih produk asal dan produk tujuan terlebih dahulu");
      return;
    }

    if (sourceProductId === targetProductId) {
      toast.error("Produk asal dan produk tujuan tidak boleh sama");
      return;
    }

    setIsMerging(true);
    try {
      const res = await fetch("/api/products/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceProductId,
          targetProductId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Gagal merge produk");
      }

      toast.success(
        data.message ||
          `Berhasil merge "${sourceProduct?.name}" ke "${targetProduct?.name}"`
      );

      // Reset state & close
      setSourceProductId("");
      setTargetProductId("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat merge produk");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-white shadow-2xl overflow-visible">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Merge Produk
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                Gabungkan dua produk sejenis atau duplikat menjadi satu produk utama.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Source Product Selector */}
          <ProductSearchInput
            label="1. Produk Asal (Akan Digabung & Dihapus)"
            placeholder="Ketik / cari nama produk asal..."
            value={sourceProductId}
            onChange={setSourceProductId}
            products={products}
            disabledId={targetProductId}
            zIndexClass="z-30"
          />

          {/* Arrow visual */}
          <div className="flex items-center justify-center gap-2 text-emerald-400 py-1">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400">DIGABUNGKAN KE</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Target Product Selector */}
          <ProductSearchInput
            label="2. Produk Tujuan (Utama yang Dipertahankan)"
            placeholder="Ketik / cari nama produk tujuan..."
            value={targetProductId}
            onChange={setTargetProductId}
            products={products}
            disabledId={sourceProductId}
            zIndexClass="z-20"
          />

          {/* Summary Alert */}
          {sourceProduct && targetProduct && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Konfirmasi Penggabungan Produk</span>
              </div>
              <p className="leading-relaxed">
                Produk <strong className="text-white">"{sourceProduct.name}"</strong> (Supplier: <span className="font-bold text-amber-300">{sourceProduct.supplier?.name || "Tanpa Supplier"}</span>) akan digabungkan ke{" "}
                <strong className="text-white">"{targetProduct.name}"</strong> (Supplier: <span className="font-bold text-emerald-300">{targetProduct.supplier?.name || "Tanpa Supplier"}</span>). Semua riwayat item laporan konsinyasi akan disesuaikan ke nama produk tujuan dan produk asal akan dihapus.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isMerging}
            className="text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            Batal
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isMerging || !sourceProductId || !targetProductId}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5"
          >
            {isMerging ? "Memproses..." : "Proses Merge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

