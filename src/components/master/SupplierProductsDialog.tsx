import { useState } from "react";
import { Package, PlusCircle, ChevronLeft, Pencil, Trash2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SupplierProductsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSupplier: any;
  productsLoading: boolean;
  supplierProducts: any[];
  onProductAdded?: () => void;
}

export function SupplierProductsDialog({
  isOpen,
  onOpenChange,
  selectedSupplier,
  productsLoading,
  supplierProducts,
  onProductAdded
}: SupplierProductsDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = (open: boolean) => {
    if (!open) {
      setShowAddForm(false);
      setForm({ name: "", code: "" });
      setEditingId(null);
      setDeletingId(null);
    }
    onOpenChange(open);
  };

  const handleAddProduct = async () => {
    if (!form.name.trim()) {
      toast.error("Nama barang wajib diisi");
      return;
    }
    if (!selectedSupplier?.id) {
      toast.error("Suplier tidak valid");
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
          supplierId: selectedSupplier.id,
        }),
      });
      if (res.ok) {
        toast.success("Produk berhasil ditambahkan");
        setForm({ name: "", code: "" });
        setShowAddForm(false);
        onProductAdded?.();
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

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setEditForm({ name: product.name, code: product.code || "" });
    setDeletingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", code: "" });
  };

  const handleUpdateProduct = async () => {
    if (!editForm.name.trim()) {
      toast.error("Nama barang wajib diisi");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editForm.name.trim().toUpperCase(),
          code: editForm.code.trim() || null,
          supplierId: selectedSupplier?.id,
        }),
      });
      if (res.ok) {
        toast.success("Produk berhasil diperbarui");
        cancelEdit();
        onProductAdded?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memperbarui produk");
      }
    } catch {
      toast.error("Gagal memperbarui produk");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      });
      if (res.ok) {
        toast.success("Produk berhasil dihapus");
        setDeletingId(null);
        onProductAdded?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menghapus produk");
      }
    } catch {
      toast.error("Gagal menghapus produk");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-950 border border-white/10 text-white backdrop-blur-3xl shadow-2xl rounded-[2rem] p-0 w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <div className="p-8 pb-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <span>Daftar Produk: <span className="text-emerald-400">{selectedSupplier?.name}</span></span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-13">
              Daftar produk yang dipasok oleh suplier ini
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Add Product Form (slide-in) */}
        {showAddForm && (
          <div className="px-8 py-6 bg-slate-900/30 border-y border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => { setShowAddForm(false); setForm({ name: "", code: "" }); }}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Tambah Produk Baru
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Nama Barang *</label>
                <Input
                  placeholder="Contoh: Bacang Ayam"
                  className="h-11 bg-slate-950/50 border-white/5 rounded-xl text-white font-bold placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all px-4"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                  onKeyDown={e => { if (e.key === "Enter") handleAddProduct(); }}
                  autoFocus
                />
              </div>
              <div className="sm:w-48 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Kode Barang</label>
                <Input
                  placeholder="Opsional"
                  className="h-11 bg-slate-950/50 border-white/5 rounded-xl text-white font-mono font-bold placeholder:text-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all px-4"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") handleAddProduct(); }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="h-11 px-6 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-lg shadow-emerald-900/20 transition-all text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer"
                  onClick={handleAddProduct}
                  disabled={isSaving}
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto px-8 py-4 max-h-[50vh] scrollbar-thin">
          {productsLoading ? (
            <div className="space-y-4 py-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-full bg-white/5 rounded-xl border border-white/5" />
              ))}
            </div>
          ) : supplierProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm font-medium italic animate-in fade-in duration-200">
              Belum ada data produk untuk suplier ini.
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <Table>
                <TableHeader className="bg-transparent sticky top-0 z-10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3 w-12 text-center">No</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3 w-40">Kode Produk</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3">Nama Produk</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3 w-24 text-right pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierProducts.map((product, index) => (
                    <TableRow key={product.id} className="border-white/5 hover:bg-white/2 transition-all group">
                      {editingId === product.id ? (
                        /* ─── EDIT MODE ─── */
                        <>
                          <TableCell className="text-slate-500 font-bold py-3 text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="py-3">
                            <Input
                              value={editForm.code}
                              onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                              placeholder="Kode"
                              className="h-9 bg-slate-950/50 border-white/10 rounded-lg text-white font-mono font-medium text-xs px-3 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                              onKeyDown={e => { if (e.key === "Enter") handleUpdateProduct(); if (e.key === "Escape") cancelEdit(); }}
                            />
                          </TableCell>
                          <TableCell className="py-3">
                            <Input
                              value={editForm.name}
                              onChange={e => setEditForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                              placeholder="Nama Barang"
                              className="h-9 bg-slate-950/50 border-white/10 rounded-lg text-white font-bold text-xs px-3 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                              autoFocus
                              onKeyDown={e => { if (e.key === "Enter") handleUpdateProduct(); if (e.key === "Escape") cancelEdit(); }}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3 pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={handleUpdateProduct}
                                disabled={isUpdating}
                                className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                          </TableCell>
                        </>
                      ) : deletingId === product.id ? (
                        /* ─── DELETE CONFIRMATION ─── */
                        <>
                          <TableCell className="text-slate-500 font-bold py-3 text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell colSpan={2} className="py-3">
                            <span className="text-red-400 font-bold text-xs">
                              Hapus &quot;{product.name}&quot;?
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-3 pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={isDeleting}
                                className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                                <span className="text-red-400 text-[10px] font-black uppercase">
                                  {isDeleting ? "..." : "Ya"}
                                </span>
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        /* ─── NORMAL VIEW ─── */
                        <>
                          <TableCell className="text-slate-500 font-bold py-3.5 text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-slate-400 font-mono font-medium text-xs">
                            {product.code || "-"}
                          </TableCell>
                          <TableCell className="text-slate-200 font-bold text-sm">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-right py-3.5 pr-6">
                            {/* Diubah agar tombol Edit/Delete langsung tampil menggunakan aksen warna hijau & merah agar selaras */}
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => startEdit(product)}
                                className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center transition-all cursor-pointer"
                                title="Edit produk"
                              >
                                <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                              <button
                                onClick={() => { setDeletingId(product.id); setEditingId(null); }}
                                className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center transition-all cursor-pointer"
                                title="Hapus produk"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              </button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <div className="p-8 bg-white/2 border-t border-white/5 flex items-center justify-between gap-3">
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="h-12 px-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          )}
          <div className={!showAddForm ? "" : "ml-auto"}>
            <Button variant="ghost" onClick={() => handleClose(false)} className="h-11 px-8 rounded-xl text-white bg-white/5 hover:bg-white/10 font-bold cursor-pointer">
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
