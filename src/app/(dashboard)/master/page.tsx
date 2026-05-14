"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Hooks
import { useMasterData, Supplier, Cashier } from "./hooks/use-master-data";

// Components
import { MasterTabs } from "@/components/master/MasterTabs";
import { SupplierTable } from "@/components/master/SupplierTable";
import { CashierTable } from "@/components/master/CashierTable";
import { SupplierAddForm } from "@/components/master/SupplierForm";
import { CashierAddForm } from "@/components/master/CashierForm";

// Dialogs
import { SupplierManageDialog } from "@/components/master/SupplierManageDialog";
import { SupplierHistoryDialog } from "@/components/master/SupplierHistoryDialog";
import { DeleteSupplierConfirmDialog } from "@/components/master/DeleteSupplierConfirmDialog";

export default function MasterDataPage() {
  const { suppliers, cashiers, loading, refresh } = useMasterData();
  
  // Search state
  const [supplierSearch, setSupplierSearch] = useState("");
  const [cashierSearch, setCashierSearch] = useState("");

  // Dialog state
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isCashierDialogOpen, setIsCashierDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Selected item state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  
  // History state
  const [supplierHistory, setSupplierHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete state
  const [deleteCredentials, setDeleteCredentials] = useState({ username: "", password: "" });
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting state
  const [supplierSortConfig, setSupplierSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [cashierSortConfig, setCashierSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  // History fetch
  useEffect(() => {
    if (isHistoryDialogOpen && selectedSupplier?.id) {
      const fetchSupplierHistory = async (supplierId: string) => {
        setHistoryLoading(true);
        setSupplierHistory([]);
        try {
          const res = await fetch(`/api/reports?supplierId=${supplierId}&limit=100`);
          const data = await res.json();
          const reportsData = Array.isArray(data) ? data : (data.reports || []);
          setSupplierHistory(reportsData);
        } catch (error) {
          toast.error("Gagal mengambil riwayat transaksi");
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchSupplierHistory(selectedSupplier.id);
    }
  }, [isHistoryDialogOpen, selectedSupplier?.id]);

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
        <h2 className="text-3xl font-bold tracking-tight text-white">Data Master</h2>
        <p className="text-muted-foreground">Kelola data suplier dan kasir sistem Anda.</p>
      </div>

      <MasterTabs 
        supplierContent={
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 bg-white/[0.02] py-6 px-8 gap-4">
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl font-bold text-white">Daftar Suplier</CardTitle>
                <CardDescription className="text-slate-400">Kelola informasi UMKM, pemilik, dan Pendapatan bagi hasil.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input 
                    placeholder="Cari suplier..." 
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="pl-10 h-11 bg-white/5 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-500 font-medium"
                  />
                </div>
                <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                  <DialogTrigger render={
                    <Button className="h-11 px-6 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                      <Plus className="w-5 h-5 mr-2" /> Tambah Suplier
                    </Button>
                  } />
                  <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black text-white">Tambah Suplier</DialogTitle>
                      <DialogDescription className="text-slate-400 font-medium">Masukkan detail suplier untuk disimpan ke sistem.</DialogDescription>
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
                  setIsHistoryDialogOpen(true);
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
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
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
                <Dialog open={isCashierDialogOpen} onOpenChange={setIsCashierDialogOpen}>
                  <DialogTrigger render={
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" /> Tambah Kasir
                    </Button>
                  } />
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
              <CashierTable 
                filteredCashiers={filteredCashiers}
                loading={loading}
                cashierSearch={cashierSearch}
                cashierSortConfig={cashierSortConfig}
                requestCashierSort={requestCashierSort}
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

      <SupplierHistoryDialog 
        isOpen={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        selectedSupplier={selectedSupplier}
        historyLoading={historyLoading}
        supplierHistory={supplierHistory}
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
