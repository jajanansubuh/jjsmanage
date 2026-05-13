"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Printer, Package, History, Trash2, Save, CheckCircle2, Clock, Loader2, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  code: string | null;
  supplierId: string | null;
  supplierName?: string;
}

interface PrintItem extends Product {
  qty: number;
}

export default function CetakLabelPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false); // Render UI immediately
  const [isDataLoading, setIsDataLoading] = useState(true); // Loading for products
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<PrintItem[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [isSavingQueue, setIsSavingQueue] = useState(false);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [codeLookupMap, setCodeLookupMap] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isClearQueueDialogOpen, setIsClearQueueDialogOpen] = useState(false);

  const normalizeName = (name: any) => {
    return String(name || "")
      .trim()
      .toUpperCase()
      .replace(/[.,\s]+$/, "")
      .replace(/\s+/g, " ");
  };

  const fetchProducts = async (roleOverride?: string) => {
    try {
      const role = roleOverride || userRole;

      // Fetch code lookup map from ALL master products (codes are catalog data, not sensitive)
      const localCodeMap: Record<string, string> = {};
      try {
        const lookupRes = await fetch("/api/products?forLookup=true");
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          lookupData.forEach((p: any) => {
            localCodeMap[normalizeName(p.name)] = p.code || "";
          });
        }
      } catch (e) {
        console.error("Failed to fetch code lookup:", e);
      }

      // Fetch the supplier's OWN products (filtered by supplierId on server)
      const res = await fetch("/api/products");
      if (res.ok) {
        const myProducts = await res.json();

        // Enrich supplier's products with codes from the lookup map
        let displayData = myProducts.map((p: any) => ({
          ...p,
          code: p.code || localCodeMap[normalizeName(p.name)] || null,
          supplierName: p.supplier?.name || "Tanpa Suplier"
        }));

        // For suppliers, also pull products from their reports (API already filters by supplierId)
        if (role === "SUPPLIER") {
          try {
            const reportRes = await fetch("/api/reports?limit=50");
            if (reportRes.ok) {
              const reportData = await reportRes.json();
              const existingNames = new Set(displayData.map((p: any) => normalizeName(p.name)));

              reportData.reports?.forEach((report: any) => {
                report.items?.forEach((item: any) => {
                  const rawName = item.name;
                  if (!rawName) return;

                  const normalized = normalizeName(rawName);
                  if (!existingNames.has(normalized)) {
                    displayData.push({
                      id: `report-${normalized}`,
                      name: rawName.toUpperCase(),
                      code: localCodeMap[normalized] || item.code || null,
                      supplierId: report.supplierId,
                      supplierName: report.supplier?.name || "Tanpa Suplier"
                    });
                    existingNames.add(normalized);
                  }
                });
              });
            }
          } catch (reportErr) {
            console.error("Failed to fetch products from reports:", reportErr);
          }
        }

        setProducts(displayData);
        
        // Auto-populate selected items for Supplier
        if (role === "SUPPLIER" && displayData.length > 0) {
          setSelectedItems(displayData.map((p: any) => ({ ...p, qty: 1 })));
        }
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const role = data.role?.toUpperCase() || "SUPPLIER";
        setUserRole(role);
        return role;
      }
    } catch (err) {
      console.error("Failed to fetch role:", err);
    }
    return null;
  };

  const fetchCodeLookup = async () => {
    try {
      const res = await fetch("/api/products?forLookup=true");
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        data.forEach((p: any) => {
          map[normalizeName(p.name)] = p.code || "";
        });
        setCodeLookupMap(map);
        return map;
      }
    } catch (e) {
      console.error("Failed to fetch code lookup:", e);
    }
    return {};
  };

  const fetchQueue = async (lookupOverride?: Record<string, string>) => {
    setIsQueueLoading(true);
    try {
      const res = await fetch("/api/print-queue?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        const lookup = lookupOverride || codeLookupMap;
        // Enrich queue items with codes from master lookup
        const enriched = data.map((item: any) => ({
          ...item,
          code: item.code || lookup[normalizeName(item.name)] || null,
        }));

        // Sort by Supplier Name (A-Z), then by Product Name (A-Z)
        enriched.sort((a: any, b: any) => {
          const supplierA = (a.supplier?.name || "").toUpperCase();
          const supplierB = (b.supplier?.name || "").toUpperCase();
          if (supplierA < supplierB) return -1;
          if (supplierA > supplierB) return 1;

          const nameA = (a.name || "").toUpperCase();
          const nameB = (b.name || "").toUpperCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });

        setQueueItems(enriched);
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    } finally {
      setIsQueueLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const role = await fetchUserRole();
      const lookup = await fetchCodeLookup();
      await fetchProducts(role || undefined);
      fetchQueue(lookup);
    };
    init();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const sortedSelectedItems = useMemo(() => {
    return [...selectedItems].sort((a, b) => {
      const sA = (a.supplierName || "").toUpperCase();
      const sB = (b.supplierName || "").toUpperCase();
      if (sA < sB) return -1;
      if (sA > sB) return 1;
      
      const nA = (a.name || "").toUpperCase();
      const nB = (b.name || "").toUpperCase();
      if (nA < nB) return -1;
      if (nA > nB) return 1;
      return 0;
    });
  }, [selectedItems]);

  const addItem = (product: any) => {
    if (selectedItems.find(item => item.id === product.id)) {
      toast.info("Produk sudah ada di daftar");
      return;
    }
    setSelectedItems([...selectedItems, { 
      ...product, 
      qty: 1, 
      supplierName: product.supplierName || product.supplier?.name || "Tanpa Suplier" 
    }]);
    setSearchTerm("");
  };

  const updateQty = (id: string, qty: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, qty: Math.max(1, qty) } : item
    ));
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const handlePrint = async () => {
    if (selectedItems.length === 0) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }
    window.print();
  };

  const saveToQueue = async () => {
    if (selectedItems.length === 0) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }

    setIsSavingQueue(true);
    try {
      const res = await fetch("/api/print-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedItems.map(item => ({
          name: item.name,
          code: item.code,
          qty: item.qty
        })))
      });

      if (res.ok) {
        toast.success("Permintaan cetak berhasil dikirim ke Admin");
        setSelectedItems([]);
        fetchQueue();
      } else {
        toast.error("Gagal mengirim permintaan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSavingQueue(false);
    }
  };

  const markAsDone = async (id: string) => {
    try {
      await fetch("/api/print-queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "DONE" })
      });
      fetchQueue();
    } catch (err) {
      toast.error("Gagal memperbarui status");
    }
  };

  const clearQueue = async () => {
    try {
      await fetch("/api/print-queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      fetchQueue();
      toast.success("Antrean dibersihkan");
      setIsClearQueueDialogOpen(false);
    } catch (err) {
      toast.error("Gagal membersihkan antrean");
    }
  };

  const addFromQueue = (item: any) => {
    if (selectedItems.find(si => si.name === item.name && si.code === item.code)) {
      toast.info("Barang sudah ada di daftar cetak");
      return;
    }
    const code = item.code || codeLookupMap[normalizeName(item.name)] || null;
    setSelectedItems([...selectedItems, { 
      id: item.id, 
      name: item.name, 
      code, 
      qty: item.qty,
      supplierId: item.supplierId,
      supplierName: item.supplier?.name || "Tanpa Suplier"
    }]);
  };

  const handleExportQueue = () => {
    if (queueItems.length === 0) {
      toast.error("Antrean kosong, tidak ada data untuk diekspor");
      return;
    }
    setIsExporting(true);
    try {
      const dataToExport = queueItems.map(item => ({
        "Kode Barang": item.code || codeLookupMap[normalizeName(item.name)] || "",
        "Nama Barang": item.name,
        "Qty": item.qty,
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Label Cetak");
      XLSX.writeFile(wb, `Label_Cetak_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Data berhasil diekspor");
    } catch (err) {
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            {userRole === "ADMIN" ? "Cetak" : "Input"} <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Label Harga</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            {userRole === "ADMIN" 
              ? "Cetak label harga dari antrean suplier atau pilih manual." 
              : "Pilih produk dan tentukan jumlah label yang ingin dicetak oleh admin."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userRole === "SUPPLIER" ? (
            <Button
              onClick={saveToQueue}
              disabled={isSavingQueue || selectedItems.length === 0}
              className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white font-black gap-2 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              {isSavingQueue ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Kirim ke Admin</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handleExportQueue}
                disabled={isExporting || queueItems.length === 0}
                variant="outline"
                className="h-12 px-6 bg-slate-950/50 border-white/5 rounded-2xl hover:bg-white/5 text-white gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{isExporting ? "Memproses..." : "Export Excel"}</span>
              </Button>
              <Button
                onClick={handlePrint}
                disabled={selectedItems.length === 0}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-black gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                <Printer className="w-5 h-5" />
                <span>Cetak Label</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Admin Quick Queue View (Only for Admin) */}
      {userRole === "ADMIN" && (
        <div className="space-y-6 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Antrean Dari Suplier</h3>
                <p className="text-slate-400 text-xs font-medium">Klik untuk menambahkan ke daftar cetak.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => fetchQueue()} disabled={isQueueLoading} className="text-slate-400 hover:text-white">
                <History className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsClearQueueDialogOpen(true)} className="text-slate-500 hover:text-red-400">
                Bersihkan
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queueItems.length === 0 ? (
              <div className="col-span-full py-8 text-center bg-slate-900/20 rounded-2xl border border-dashed border-white/5 text-slate-500 italic">
                Antrean kosong
              </div>
            ) : (
              queueItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-slate-900/40 border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group"
                  onClick={() => addFromQueue(item)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-purple-400 uppercase truncate">{item.supplier?.name}</p>
                      <p className="font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">{item.code || "-"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-white/5 px-2 py-1 rounded-lg font-black text-white text-xs">
                        x{item.qty}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); markAsDone(item.id); }}
                        className="h-6 w-6 p-0 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Product Search (Available for both, but secondary for Admin) */}
      <div className="relative group no-print">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
        <Input
          placeholder={userRole === "ADMIN" ? "Cari barang tambahan..." : "Cari barang yang ingin dicetak..."}
          className="pl-12 pr-4 h-14 bg-slate-900/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium text-white text-lg"
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
                    onClick={() => addItem(product)}
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

      {/* Selected Items List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 px-2">Daftar Barang Siap {userRole === "ADMIN" ? "Cetak" : "Kirim"}</h3>
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Kode Barang</TableHead>
                  <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Nama Barang</TableHead>
                  <TableHead className="py-6 px-8 text-center font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Qty (Label)</TableHead>
                  <TableHead className="py-6 px-8 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 no-print">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSelectedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-slate-500 font-medium italic">
                      Belum ada barang yang dipilih.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSelectedItems.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <TableCell className="py-5 px-8 font-mono text-sm text-blue-400">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">{item.supplierName}</span>
                          {item.code || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-8">
                        <p className="font-bold text-white uppercase">{item.name}</p>
                      </TableCell>
                      <TableCell className="py-5 px-8">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-20 h-10 bg-slate-950/50 border-white/10 rounded-xl text-center font-bold text-white focus:ring-blue-500/20"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-8 text-right no-print">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="w-10 h-10 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          
          .label-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5mm;
            padding: 5mm;
          }
          .label-item {
            border: 1px solid #000;
            padding: 4mm;
            text-align: center;
            height: 35mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            visibility: visible !important;
          }
          .label-name {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 1mm;
            visibility: visible !important;
          }
          .label-code {
            font-size: 9pt;
            font-family: monospace;
            visibility: visible !important;
          }
        }
      `}</style>

      {/* Print View */}
      <div className="hidden print:block print-area">
        <div className="label-grid">
          {sortedSelectedItems.map(item => (
            Array.from({ length: item.qty }).map((_, i) => (
              <div key={`${item.id}-${i}`} className="label-item">
                <div className="label-name">{item.name}</div>
                <div className="label-code">
                  <span className="mr-2">[{item.supplierName}]</span>
                  {item.code || ""}
                </div>
                <div className="mt-2 border-t border-black pt-2 font-bold text-lg">Rp ..........</div>
              </div>
            ))
          ))}
        </div>
      </div>

      {/* Clear Queue Confirmation Modal */}
      <Dialog open={isClearQueueDialogOpen} onOpenChange={setIsClearQueueDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-3xl shadow-2xl max-w-sm p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-white uppercase tracking-tight text-center">Bersihkan Antrean?</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium pt-2 text-center">
                  Tindakan ini akan menghapus semua antrean cetak yang ada. Data yang sudah dihapus tidak dapat dikembalikan.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsClearQueueDialogOpen(false)}
              className="flex-1 h-12 rounded-xl text-slate-400 font-bold hover:bg-white/5"
            >
              Batal
            </Button>
            <Button
              onClick={clearQueue}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              YA, HAPUS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
