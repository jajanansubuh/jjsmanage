"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Hooks
import { useMasterData, Supplier } from "./hooks/use-master-data";

// Components
import { MasterTabs } from "@/components/master/MasterTabs";
import { SupplierTable } from "@/components/master/SupplierTable";
import { CashierTable } from "@/components/master/CashierTable";
import { MasterProductsTable } from "@/components/master/MasterProductsTable";
import { SupplierAddForm } from "@/components/master/SupplierForm";
import { CashierAddForm } from "@/components/master/CashierForm";

// Dialogs
import { SupplierManageDialog } from "@/components/master/SupplierManageDialog";
import { SupplierProductsDialog } from "@/components/master/SupplierProductsDialog";
import { DeleteSupplierConfirmDialog } from "@/components/master/DeleteSupplierConfirmDialog";

export default function MasterDataPage() {
  const { 
    suppliers, 
    cashiers, 
    products, 
    loading, 
    productsLoading, 
    refresh, 
    refreshProducts 
  } = useMasterData();
  
  // Search state
  const [supplierSearch, setSupplierSearch] = useState("");
  const [cashierSearch, setCashierSearch] = useState("");

  // Dialog state
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isCashierDialogOpen, setIsCashierDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Selected item state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  
  // Products state
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [productsLoadingState, setProductsLoadingState] = useState(false);

  // Delete state
  const [deleteCredentials, setDeleteCredentials] = useState({ username: "", password: "" });
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting state
  const [supplierSortConfig, setSupplierSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [cashierSortConfig, setCashierSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  // Products fetch
  useEffect(() => {
    if (isProductsDialogOpen && selectedSupplier?.id) {
      const fetchSupplierProducts = async (supplierId: string) => {
        setProductsLoadingState(true);
        setSupplierProducts([]);
        try {
          const res = await fetch(`/api/products?supplierId=${supplierId}`);
          const data = await res.json();
          setSupplierProducts(Array.isArray(data) ? data : []);
        } catch (error) {
          toast.error("Gagal mengambil daftar produk");
        } finally {
          setProductsLoadingState(false);
        }
      };
      fetchSupplierProducts(selectedSupplier.id);
    }
  }, [isProductsDialogOpen, selectedSupplier?.id]);

  // Sorting & Filtering (Suppliers)
  const filteredSuppliers = useMemo(() => {
    let result = Array.isArray(suppliers) ? [...suppliers] : [];
    
    if (supplierSearch) {
      const query = supplierSearch.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.ownerName && s.ownerName.toLowerCase().includes(query)) ||
        (s.bankName && s.bankName.toLowerCase().includes(query)) ||
        (s.accountNumber && s.accountNumber.toLowerCase().includes(query))
      );
    }

    if (supplierSortConfig !== null) {
      result.sort((a, b) => {
        const aVal = a[supplierSortConfig.key as keyof typeof a] ?? null;
        const bVal = b[supplierSortConfig.key as keyof typeof b] ?? null;
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (aVal < bVal) return supplierSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return supplierSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [suppliers, supplierSortConfig, supplierSearch]);

  const requestSupplierSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (supplierSortConfig && supplierSortConfig.key === key && supplierSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSupplierSortConfig({ key, direction });
  };

  // Sorting & Filtering (Cashiers)
  const filteredCashiers = useMemo(() => {
    let result = Array.isArray(cashiers) ? [...cashiers] : [];

    if (cashierSearch) {
      const query = cashierSearch.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.code.toLowerCase().includes(query)
      );
    }

    if (cashierSortConfig !== null) {
      result.sort((a, b) => {
        const aVal = a[cashierSortConfig.key as keyof typeof a] ?? null;
        const bVal = b[cashierSortConfig.key as keyof typeof b] ?? null;
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (aVal < bVal) return cashierSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return cashierSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [cashiers, cashierSortConfig, cashierSearch]);

  const requestCashierSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (cashierSortConfig && cashierSortConfig.key === key && cashierSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setCashierSortConfig({ key, direction });
  };

  // Actions
  const handleAddSupplier = async (data: any) => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success("Suplier berhasil ditambahkan");
        setIsSupplierDialogOpen(false);
        refresh();
      } else {
        toast.error("Gagal menambahkan suplier");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleUpdateSupplier = async (data: any) => {
    try {
      const res = await fetch(`/api/suppliers/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Suplier berhasil diperbarui");
        setIsManageDialogOpen(false);
        refresh();
      } else {
        toast.error("Gagal memperbarui suplier");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!deleteCredentials.username || !deleteCredentials.password) {
      setDeleteError("Username dan password wajib diisi");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteCredentials),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("Suplier berhasil dihapus");
        setIsDeleteConfirmOpen(false);
        setIsManageDialogOpen(false);
        setDeleteCredentials({ username: "", password: "" });
        refresh();
      } else {
        setDeleteError(result.error || "Gagal menghapus suplier");
        toast.error(result.error || "Gagal menghapus suplier");
      }
    } catch (error) {
      setDeleteError("Terjadi kesalahan jaringan");
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCashier = async (data: any) => {
    try {
      const res = await fetch("/api/cashiers", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success("Kasir berhasil ditambahkan");
        setIsCashierDialogOpen(false);
        refresh();
      } else {
        toast.error("Gagal menambahkan kasir");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white">Data Master</h2>
        <p className="text-muted-foreground">Kelola data suplier, kasir, dan produk sistem Anda.</p>
      </div>

      <MasterTabs 
        supplierContent={
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b border-border bg-muted/30 py-5 px-6 gap-4">
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl font-bold text-foreground">Daftar Suplier</CardTitle>
                <CardDescription className="text-muted-foreground">Kelola informasi UMKM, pemilik, dan Pendapatan bagi hasil.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Cari suplier..." 
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setIsSupplierDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Suplier
                </Button>
                <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Tambah Suplier</DialogTitle>
                      <DialogDescription>Masukkan detail suplier untuk disimpan ke sistem.</DialogDescription>
                    </DialogHeader>
                    <SupplierAddForm 
                      onSave={handleAddSupplier} 
                      onCancel={() => setIsSupplierDialogOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <SupplierTable 
                filteredSuppliers={filteredSuppliers}
                loading={loading}
                supplierSearch={supplierSearch}
                supplierSortConfig={supplierSortConfig}
                requestSupplierSort={requestSupplierSort}
                onSupplierClick={(s) => {
                  setSelectedSupplier(s);
                  setIsProductsDialogOpen(true);
                }}
                onManageClick={(s) => {
                  setSelectedSupplier(s);
                  setIsManageDialogOpen(true);
                }}
              />
            </CardContent>
          </Card>
        }
        cashierContent={
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Kasir</CardTitle>
                <CardDescription>Daftar kasir yang memiliki akses ke sistem.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
                  <Input 
                    placeholder="Cari kasir..." 
                    value={cashierSearch}
                    onChange={(e) => setCashierSearch(e.target.value)}
                    className="pl-9 h-10 bg-white/5 border-white/5 rounded-lg focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                  />
                </div>
                <Button onClick={() => setIsCashierDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Kasir
                </Button>
                <Dialog open={isCashierDialogOpen} onOpenChange={setIsCashierDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Kasir Baru</DialogTitle>
                      <DialogDescription>Masukkan detail kasir untuk disimpan ke sistem.</DialogDescription>
                    </DialogHeader>
                    <CashierAddForm 
                      onSave={handleAddCashier} 
                      onCancel={() => setIsCashierDialogOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <CardContent className="p-0">
                <CashierTable 
                  filteredCashiers={filteredCashiers}
                  loading={loading}
                  cashierSearch={cashierSearch}
                  cashierSortConfig={cashierSortConfig}
                  requestCashierSort={requestCashierSort}
                />
              </CardContent>
            </CardContent>
          </Card>
        }
        productContent={
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <MasterProductsTable
                products={products}
                loading={productsLoading}
              />
            </CardContent>
          </Card>
        }
      />

      {/* Modals */}
      <SupplierManageDialog 
        isOpen={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        selectedSupplier={selectedSupplier}
        onUpdateSupplier={handleUpdateSupplier}
        onDeleteRequest={() => {
          setSupplierToDelete(selectedSupplier?.id || null);
          setIsDeleteConfirmOpen(true);
        }}
      />

      <SupplierProductsDialog 
        isOpen={isProductsDialogOpen}
        onOpenChange={setIsProductsDialogOpen}
        selectedSupplier={selectedSupplier}
        productsLoading={productsLoadingState}
        supplierProducts={supplierProducts}
        onProductAdded={async () => {
          // Re-fetch products for this supplier
          if (selectedSupplier?.id) {
            setProductsLoadingState(true);
            try {
              const res = await fetch(`/api/products?supplierId=${selectedSupplier.id}`);
              const data = await res.json();
              setSupplierProducts(Array.isArray(data) ? data : []);
              // Also refresh global products tab
              refreshProducts();
            } catch {
              toast.error("Gagal mengambil daftar produk");
            } finally {
              setProductsLoadingState(false);
            }
          }
        }}
      />

      <DeleteSupplierConfirmDialog 
        isOpen={isDeleteConfirmOpen}
        onOpenChange={(open) => {
          setIsDeleteConfirmOpen(open);
          if (!open) {
            setDeleteCredentials({ username: "", password: "" });
            setDeleteError("");
          }
        }}
        selectedSupplier={selectedSupplier}
        deleteCredentials={deleteCredentials}
        setDeleteCredentials={setDeleteCredentials}
        deleteError={deleteError}
        isDeleting={isDeleting}
        onConfirm={() => supplierToDelete && handleDeleteSupplier(supplierToDelete)}
      />
    </div>
  );
}
