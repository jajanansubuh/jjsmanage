"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Package,
  Search,
  ArrowUpDown,
  AlertCircle,
  TrendingUp,
  History,
  Box,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Filter, Download, Upload, FileUp, Save, PlusCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Check } from "lucide-react";

interface ProductItem {
  name: string;
  qtyBeli: number;
  qtyJual: number;
  retureJual: number;
}

interface AggregatedProduct {
  name: string;
  code?: string;
  supplierId?: string;
  supplierName?: string;
  totalBeli: number;
  totalJual: number;
  totalRetureJual: number;
  transactions: number;
}

interface SupplierOption {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<AggregatedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Default to start of month
    to: new Date()
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof AggregatedProduct; direction: "asc" | "desc" } | null>({ key: "totalJual", direction: "desc" });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [masterProducts, setMasterProducts] = useState<Record<string, string>>({});
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", code: "", supplierId: "" });

  const normalizeName = (name: any) => {
    return String(name || "")
      .trim()
      .toUpperCase()
      .replace(/[.,\s]+$/, "") // Remove trailing dots, commas, or extra spaces
      .replace(/\s+/g, " ");   // Normalize internal spaces
  };

  const fetchMasterProducts = async () => {
    try {
      const res = await fetch("/api/products?forLookup=true");
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        data.forEach((p: any) => {
          map[p.name.toUpperCase()] = p.code || "";
        });
        setMasterProducts(map);
      }
    } catch (err) {
      console.error("Failed to fetch master products:", err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        const sortedSuppliers = data
          .map((s: any) => ({ id: s.id, name: s.name }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
        setSuppliers(sortedSuppliers);
      }
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  useEffect(() => {
    fetchMasterProducts();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Hanya eksekusi jika rentang tanggal lengkap (Mulai & Selesai) atau jika belum ada pilihan sama sekali
        if (dateRange?.from && !dateRange?.to) return;

        const params = new URLSearchParams();
        if (dateRange?.from) params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
        if (dateRange?.to) params.append("endDate", format(dateRange.to, "yyyy-MM-dd"));
        params.append("limit", "5000");

        const res = await fetch(`/api/reports?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil data laporan produk");

        const data = await res.json();
        const reports = data.reports || [];

        // ... rest of the aggregation logic ...
        const productMap = new Map<string, AggregatedProduct>();

        reports.forEach((report: any) => {
          const items = report.items || [];
          const reportSupplierName = report.supplier?.name || "Tanpa Suplier";
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const rawName = (item.name || '').trim();
              if (!rawName) return;
              const name = rawName.toUpperCase();

              if (productMap.has(name)) {
                const existing = productMap.get(name)!;
                existing.totalBeli += Number(item.qtyBeli ?? item.qty ?? item.beli ?? 0);
                existing.totalJual += Number(item.qtyJual ?? item.jual ?? 0);
                existing.totalRetureJual += Number(item.retureJual ?? item.retur ?? 0);
                existing.transactions += 1;
                // Update supplier name if current is generic
                if (existing.supplierName === "Tanpa Suplier") {
                  existing.supplierName = reportSupplierName;
                }
              } else {
                productMap.set(name, {
                  name: name,
                  supplierName: reportSupplierName,
                  totalBeli: Number(item.qtyBeli ?? item.qty ?? item.beli ?? 0),
                  totalJual: Number(item.qtyJual ?? item.jual ?? 0),
                  totalRetureJual: Number(item.retureJual ?? item.retur ?? 0),
                  transactions: 1
                });
              }
            });
          }
        });

         const masterRes = await fetch("/api/products?forLookup=true");
         const masterData = masterRes.ok ? await masterRes.json() : [];
         const masterMap: Record<string, { code: string; supplierName: string; supplierId: string }> = {};
         masterData.forEach((p: any) => {
           const key = normalizeName(p.name);
           masterMap[key] = {
             code: p.code || "",
             supplierName: p.supplier?.name || "Tanpa Suplier",
             supplierId: p.supplierId || ""
           };
         });
 
         const productsList = Array.from(productMap.values()).map(p => {
           const key = normalizeName(p.name);
           const master = masterMap[key];
           return {
             ...p,
             code: master?.code || "",
             // Use master supplier if available, otherwise keep report supplier
             supplierName: master?.supplierName && master.supplierName !== "Tanpa Suplier" 
               ? master.supplierName 
               : p.supplierName,
             supplierId: master?.supplierId || ""
           };
         });

        setProducts(productsList);
        setMasterProducts(Object.fromEntries(Object.entries(masterMap).map(([k, v]) => [k, v.code])));
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [dateRange]);

  const handleSort = (key: keyof AggregatedProduct) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }

        return 0;
      });
    }

    return result;
  }, [products, searchTerm, sortConfig]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const dataToExport = products.map(p => ({
        "Kode Barang": p.code || "",
        "Nama Barang": p.name,
        "Suplier": p.supplierName || "Tanpa Suplier",
        "Total Beli": p.totalBeli,
        "Total Jual": p.totalJual,
        "Reture Jual": p.totalRetureJual,
        "Persentase": ((p.totalJual / (p.totalBeli || 1)) * 100).toFixed(1) + "%"
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Produk");
      XLSX.writeFile(wb, `Katalog_Produk_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Data berhasil diekspor");
    } catch (err) {
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const formattedData = jsonData.map(row => {
          const name = row["Nama Barang"] || row["name"] || row["Nama"];
          const code = row["Kode Barang"] || row["code"] || row["Kode"];
          
          // Try to find the supplierId from current products to maintain the link
          const normalizedInputName = normalizeName(name?.toString());
          const existingProduct = products.find(p => normalizeName(p.name) === normalizedInputName);
          
          return {
            name: name?.toString().toUpperCase(), // Keep the original upper name for creation
            code,
            supplierId: existingProduct?.supplierId || null
          };
        }).filter(item => item.name);
        
        // De-duplicate items by name and supplierId to avoid conflicts in a single batch
        const uniqueItemsMap = new Map();
        formattedData.forEach(item => {
          const key = `${normalizeName(item.name)}_${item.supplierId || 'null'}`;
          uniqueItemsMap.set(key, item);
        });
        const finalData = Array.from(uniqueItemsMap.values());

        if (finalData.length === 0) {
          toast.error("Tidak ada data valid untuk diimpor");
          return;
        }

        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalData)
        });

        if (res.ok) {
          toast.success(`${formattedData.length} produk berhasil diimpor/diperbarui`);
          setIsImportOpen(false);
          fetchMasterProducts();
          // Reload current products to show new codes
          window.location.reload();
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || "Gagal menyimpan data ke server");
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal mengimpor data. Pastikan format file sesuai.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddProduct = async () => {
    if (!addForm.name.trim()) {
      toast.error("Nama barang wajib diisi");
      return;
    }
    if (!addForm.supplierId) {
      toast.error("Pilih suplier terlebih dahulu");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          code: addForm.code.trim() || undefined,
          supplierId: addForm.supplierId,
        }),
      });
      if (res.ok) {
        toast.success("Produk berhasil ditambahkan");
        setAddForm({ name: "", code: "", supplierId: "" });
        setIsAddOpen(false);
        fetchMasterProducts();
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

  const stats = useMemo(() => {
    const totalSoldRaw = products.reduce((acc, p) => acc + p.totalJual, 0);
    return {
      totalItems: products.length,
      totalSold: totalSoldRaw.toFixed(2),
      avgSellRate: products.length > 0
        ? (products.reduce((acc, p) => acc + (p.totalBeli > 0 ? (p.totalJual / p.totalBeli) * 100 : 0), 0) / products.length).toFixed(1)
        : "0"
    };
  }, [products]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Menganalisa data produk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white">Oops! Terjadi Kesalahan</h3>
        <p className="text-slate-400 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl">
          Coba Lagi
        </Button>
      </div>
    );
  }

  const ImportDialog = () => (
    <>
      <Button
        variant="outline"
        className="h-11 md:h-12 px-4 md:px-6 bg-slate-950/50 border-white/5 rounded-2xl hover:bg-white/5 text-white gap-2 transition-all flex-1 md:flex-none text-xs md:text-sm font-bold"
        onClick={() => setIsImportOpen(true)}
      >
        <Upload className="w-4 h-4 text-purple-400" />
        <span>Import</span>
      </Button>
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Upload className="w-5 h-5 text-purple-400" />
              </div>
              <span>Import <span className="text-purple-400">Produk</span></span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 pt-0 space-y-6">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
              <p className="font-bold mb-1">Petunjuk Format Excel:</p>
              <ul className="list-disc list-inside space-y-1 opacity-80">
                <li>Gunakan kolom: <strong>Nama Barang</strong> dan <strong>Kode Barang</strong></li>
                <li>Sistem akan mencocokkan Nama Barang yang sudah ada</li>
                <li>Jika Nama Barang cocok, Kode Barang akan diperbarui</li>
              </ul>
            </div>

            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl hover:border-blue-500/50 transition-colors cursor-pointer group relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImport}
                disabled={isImporting}
              />
              {isImporting ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-400">Memproses...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">Klik atau seret file ke sini</p>
                    <p className="text-xs text-slate-500 mt-1">XLSX, XLS, atau CSV</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1800px] mx-auto pb-10 px-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Katalog <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Produk</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium">Ringkasan performa penjualan produk Anda berdasarkan transaksi terbaru.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 no-print">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="h-11 md:h-12 px-4 md:px-6 bg-slate-950/50 border-white/5 rounded-2xl hover:bg-white/5 text-white gap-2 transition-all flex-1 md:flex-none text-xs md:text-sm font-bold"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>{isExporting ? "..." : "Export"}</span>
          </Button>
          <ImportDialog />
          <>
            <Button
              className="h-11 md:h-12 px-4 md:px-6 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white gap-2 transition-all w-full md:w-auto text-xs md:text-sm font-black"
              onClick={() => setIsAddOpen(true)}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Produk</span>
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
                          {suppliers.find(s => s.id === addForm.supplierId)?.name || "-- Pilih Suplier --"}
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
                                    setAddForm(f => ({ ...f, supplierId: s.id }));
                                    setIsSupplierPopoverOpen(false);
                                    setSupplierSearch("");
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all text-left",
                                    addForm.supplierId === s.id 
                                      ? "bg-emerald-500/10 text-emerald-400" 
                                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                                  )}
                                >
                                  <span>{s.name}</span>
                                  {addForm.supplierId === s.id && <Check className="w-3 h-3" />}
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
                      value={addForm.name}
                      onChange={e => setAddForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Kode Barang</label>
                    <Input
                      placeholder="Contoh: BRG001 (opsional)"
                      className="h-14 lg:h-12 bg-slate-900/50 border-white/5 rounded-2xl text-white font-mono font-bold placeholder:text-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all px-4"
                      value={addForm.code}
                      onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
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
                    onClick={() => { setIsAddOpen(false); setAddForm({ name: "", code: "", supplierId: "" }); }}
                  >
                    Batal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5 no-print w-full lg:w-auto">
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors group cursor-pointer w-full">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Periode Laporan</span>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger className="flex items-center gap-2 text-sm font-bold text-white focus:outline-none p-0 h-auto bg-transparent border-none hover:text-blue-400 transition-colors cursor-pointer">
                    <CalendarIcon className="w-4 h-4 text-blue-400" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span className="truncate">
                          {format(dateRange.from, "dd MMM", { locale: localeId })} - {format(dateRange.to, "dd MMM yyyy", { locale: localeId })}
                        </span>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: localeId })
                      )
                    ) : (
                      <span>Pilih Tanggal</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="end">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-2 border-r border-white/5 flex flex-col gap-1 bg-white/[0.02]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start font-bold text-[10px] uppercase tracking-wider hover:bg-blue-500/10 hover:text-blue-400"
                          onClick={() => {
                            setDateRange({ from: new Date(), to: new Date() });
                            setIsCalendarOpen(false);
                          }}
                        >
                          Hari Ini
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start font-bold text-[10px] uppercase tracking-wider hover:bg-blue-500/10 hover:text-blue-400"
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(start.getDate() - 7);
                            setDateRange({ from: start, to: end });
                            setIsCalendarOpen(false);
                          }}
                        >
                          7 Hari Terakhir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start font-bold text-[10px] uppercase tracking-wider hover:bg-blue-500/10 hover:text-blue-400"
                          onClick={() => {
                            const now = new Date();
                            setDateRange({
                              from: new Date(now.getFullYear(), now.getMonth(), 1),
                              to: now
                            });
                            setIsCalendarOpen(false);
                          }}
                        >
                          Bulan Ini
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start font-bold text-[10px] uppercase tracking-wider hover:bg-blue-500/10 hover:text-blue-400"
                          onClick={() => {
                            const now = new Date();
                            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                            setDateRange({ from: lastMonth, to: endOfLastMonth });
                            setIsCalendarOpen(false);
                          }}
                        >
                          Bulan Lalu
                        </Button>
                      </div>
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range, selectedDay) => {
                          if (dateRange?.from && dateRange?.to) {
                            setDateRange({ from: selectedDay, to: undefined });
                          } else {
                            setDateRange(range);
                          }

                          const nextRange = (dateRange?.from && dateRange?.to)
                            ? { from: selectedDay, to: undefined }
                            : range;

                          if (nextRange?.from && nextRange?.to) {
                            setIsCalendarOpen(false);
                          }
                        }}
                        numberOfMonths={1}
                        className="p-4 text-white"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="relative group w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <Input
              placeholder="Cari nama produk..."
              className="pl-11 pr-4 h-14 lg:h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-white placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl md:rounded-[2rem] overflow-hidden group hover:border-blue-500/20 transition-all">
          <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Box className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Varian Produk</p>
              <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stats.totalItems}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl md:rounded-[2rem] overflow-hidden group hover:border-purple-500/20 transition-all">
          <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Total Terjual</p>
              <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                {Number(stats.totalSold).toLocaleString('id-ID', { maximumFractionDigits: 2 })} 
                <span className="text-sm font-bold text-slate-500 ml-1">Pcs</span>
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl md:rounded-[2rem] overflow-hidden group hover:border-emerald-500/20 transition-all">
          <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Rasio Terjual</p>
              <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stats.avgSellRate}%</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table / List */}
      <div className="space-y-4 px-4 md:px-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <History className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white">Akumulasi Stok & Penjualan</h3>
        </div>

        <div className="md:hidden space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
              <p className="text-slate-500 font-medium italic">Belum ada data produk.</p>
            </div>
          ) : (
            filteredProducts.map((product, idx) => {
              const sellRate = product.totalBeli > 0 ? ((product.totalJual / product.totalBeli) * 100).toFixed(1) : "0";
              return (
                <Card key={idx} className="bg-slate-900/40 border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500/20 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-all">
                          <Package className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 block">
                            {product.code || "No Code"}
                          </span>
                          <h4 className="text-lg font-black text-white leading-tight uppercase line-clamp-2">{product.name}</h4>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Suplier</span>
                        <p className="text-sm font-bold text-blue-400 truncate">{product.supplierName}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Beli</span>
                        <p className="text-sm font-bold text-slate-300">{product.totalBeli} Pcs</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex-1 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 block mb-1">Terjual</span>
                        <p className="text-2xl font-black text-emerald-400 tracking-tighter">
                          {product.totalJual % 1 === 0 ? product.totalJual : product.totalJual.toFixed(2)}
                          <span className="text-xs font-bold ml-1 text-emerald-500/50">Pcs</span>
                        </p>
                      </div>
                      <div className="flex-1 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/70 block mb-1">Retur</span>
                        <p className="text-2xl font-black text-rose-400 tracking-tighter">
                          {product.totalRetureJual}
                          <span className="text-xs font-bold ml-1 text-rose-500/50">Pcs</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rasio Penjualan</span>
                        <span className="text-base font-black text-white">{sellRate}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-1000"
                          style={{ width: `${Math.min(100, Number(sellRate))}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <Card className="hidden md:block border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-6 px-4 cursor-pointer group w-[350px]" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Nama Barang <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 text-center">
                      <div className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Kode Barang
                      </div>
                    </TableHead>
                    <TableHead className="py-6 text-center cursor-pointer group" onClick={() => handleSort("supplierName" as any)}>
                      <div className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Suplier <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 text-center cursor-pointer group" onClick={() => handleSort("totalBeli")}>
                      <div className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Total Beli <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 text-center cursor-pointer group" onClick={() => handleSort("totalJual")}>
                      <div className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Total Jual <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 text-center cursor-pointer group" onClick={() => handleSort("totalRetureJual")}>
                      <div className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Reture Jual <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 px-4 text-right min-w-[160px]">
                      <div className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Persentase
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-24 text-slate-500 font-medium italic">
                        Belum ada data produk yang tercatat.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product, idx) => {
                      const sellRate = product.totalBeli > 0
                        ? ((product.totalJual / product.totalBeli) * 100).toFixed(1)
                        : "0";

                      return (
                        <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02] transition-all duration-300 group">
                          <TableCell className="py-6 px-4 w-[350px]">
                            <div className="flex items-center gap-4 max-w-[340px]">
                              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-all">
                                <Package className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                              </div>
                              <span className="font-black text-lg text-white tracking-tight group-hover:text-blue-400 transition-colors truncate block">
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                              {product.code || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-bold text-slate-400">
                              {product.supplierName}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-slate-400 text-lg">
                              {product.totalBeli}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-black text-xl text-emerald-400">
                              {product.totalJual % 1 === 0 
                                ? product.totalJual.toLocaleString('id-ID') 
                                : product.totalJual.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-lg text-rose-400">
                              {product.totalRetureJual}
                            </span>
                          </TableCell>
                          <TableCell className="text-right px-4 min-w-[160px]">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-xl text-white tracking-tighter">
                                {sellRate}%
                              </span>
                              <div className="w-32 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="h-full bg-linear-to-r from-blue-500 to-emerald-500"
                                  style={{ width: `${Math.min(100, Number(sellRate))}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
