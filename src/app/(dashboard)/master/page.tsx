"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Plus, Search, UserPlus, Database, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export default function MasterDataPage() {
  const [suppliers, setSuppliers] = useState<{ id: string, name: string, ownerName?: string | null, bankName?: string | null, accountNumber?: string | null, balance: number }[]>([]);
  const [cashiers, setCashiers] = useState<{ id: string, name: string, code: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [newSupplier, setNewSupplier] = useState({ name: "", ownerName: "", bankName: "", accountNumber: "" });
  const [newCashier, setNewCashier] = useState({ name: "", code: "" });

  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isCashierDialogOpen, setIsCashierDialogOpen] = useState(false);

  const [supplierSortConfig, setSupplierSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [cashierSortConfig, setCashierSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedSuppliers = useMemo(() => {
    let sortable = Array.isArray(suppliers) ? [...suppliers] : [];
    if (supplierSortConfig !== null) {
      sortable.sort((a, b) => {
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
    return sortable;
  }, [suppliers, supplierSortConfig]);

  const sortedCashiers = useMemo(() => {
    let sortable = Array.isArray(cashiers) ? [...cashiers] : [];
    if (cashierSortConfig !== null) {
      sortable.sort((a, b) => {
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
    return sortable;
  }, [cashiers, cashierSortConfig]);

  const requestSupplierSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (supplierSortConfig && supplierSortConfig.key === key && supplierSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSupplierSortConfig({ key, direction });
  };

  const requestCashierSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (cashierSortConfig && cashierSortConfig.key === key && cashierSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setCashierSortConfig({ key, direction });
  };

  const getSortIcon = (config: { key: string, direction: 'asc' | 'desc' } | null, key: string) => {
    if (!config || config.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 inline-block text-slate-600" />;
    return config.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3 inline-block text-blue-400" /> : <ArrowDown className="ml-2 h-3 w-3 inline-block text-blue-400" />;
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [suppRes, cashRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/cashiers")
      ]);
      const suppData = await suppRes.json();
      const cashData = await cashRes.json();
      setSuppliers(suppData);
      setCashiers(cashData);
    } catch (error) {
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSupplier() {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(newSupplier),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success("Suplier berhasil ditambahkan");
        setIsSupplierDialogOpen(false);
        setNewSupplier({ name: "", ownerName: "", bankName: "", accountNumber: "" });
        fetchData();
      } else {
        toast.error("Gagal menambahkan suplier");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  }

  async function handleAddCashier() {
    try {
      const res = await fetch("/api/cashiers", {
        method: "POST",
        body: JSON.stringify(newCashier),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success("Kasir berhasil ditambahkan");
        setIsCashierDialogOpen(false);
        setNewCashier({ name: "", code: "" });
        fetchData();
      } else {
        toast.error("Gagal menambahkan kasir");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Data Master</h2>
        <p className="text-muted-foreground">Kelola data suplier dan kasir sistem Anda.</p>
      </div>

      <Tabs defaultValue="suppliers" className="w-full relative z-10">
        <TabsList className="flex w-fit p-1.5 mb-10 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl">
          <TabsTrigger value="suppliers" className="flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20">
            <Database className="w-4 h-4 mr-2" /> Data Suplier
          </TabsTrigger>
          <TabsTrigger value="cashiers" className="flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20">
            <UserPlus className="w-4 h-4 mr-2" /> Data Kasir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 bg-white/[0.02] py-6 px-8 gap-4">
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl font-bold text-white">Daftar Suplier</CardTitle>
                <CardDescription className="text-slate-400">Kelola informasi UMKM, pemilik, dan Pendapatan bagi hasil.</CardDescription>
              </div>
              <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                <DialogTrigger render={
                  <Button className="h-11 px-6 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    <Plus className="w-5 h-5 mr-2" /> Tambah Suplier
                  </Button>
                } />
                <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-white">Tambah Suplier</DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">Masukkan detail suplier untuk disimpan ke sistem.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-5 py-6">
                    <div className="grid gap-2.5">
                      <Label htmlFor="name" className="text-slate-300 font-bold ml-1">Nama UMKM</Label>
                      <Input
                        id="name"
                        placeholder="Contoh: Abang"
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="ownerName" className="text-slate-300 font-bold ml-1">Nama Pemilik</Label>
                      <Input
                        id="ownerName"
                        placeholder="Contoh: Bpk. Ucup"
                        value={newSupplier.ownerName}
                        onChange={(e) => setNewSupplier({ ...newSupplier, ownerName: e.target.value })}
                        className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="bankName" className="text-slate-300 font-bold ml-1">Nama Bank</Label>
                      <Input
                        id="bankName"
                        placeholder="Contoh: BCA, Mandiri, dll"
                        value={newSupplier.bankName}
                        onChange={(e) => setNewSupplier({ ...newSupplier, bankName: e.target.value })}
                        className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="accountNumber" className="text-slate-300 font-bold ml-1">No Rekening</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Contoh: 1234567890"
                        value={newSupplier.accountNumber}
                        onChange={(e) => setNewSupplier({ ...newSupplier, accountNumber: e.target.value })}
                        className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-3 sm:gap-0">
                    <Button variant="ghost" onClick={() => setIsSupplierDialogOpen(false)} className="h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold">Batal</Button>
                    <Button onClick={handleAddSupplier} className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20">Simpan Suplier</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead onClick={() => requestSupplierSort('name')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-8 cursor-pointer hover:text-white transition-colors group/th">
                        Nama UMKM {getSortIcon(supplierSortConfig, 'name')}
                      </TableHead>
                      <TableHead onClick={() => requestSupplierSort('ownerName')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 cursor-pointer hover:text-white transition-colors group/th">
                        Pemilik {getSortIcon(supplierSortConfig, 'ownerName')}
                      </TableHead>
                      <TableHead onClick={() => requestSupplierSort('bankName')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 cursor-pointer hover:text-white transition-colors group/th">
                        Bank {getSortIcon(supplierSortConfig, 'bankName')}
                      </TableHead>
                      <TableHead onClick={() => requestSupplierSort('accountNumber')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 cursor-pointer hover:text-white transition-colors group/th">
                        No Rekening {getSortIcon(supplierSortConfig, 'accountNumber')}
                      </TableHead>
                      <TableHead onClick={() => requestSupplierSort('balance')} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right cursor-pointer hover:text-white transition-colors group/th">
                        Pendapatan {getSortIcon(supplierSortConfig, 'balance')}
                      </TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-8 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20"><div className="flex flex-col items-center gap-3 text-slate-500"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span>Memuat data...</span></div></TableCell></TableRow>
                    ) : sortedSuppliers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500 font-medium italic">Belum ada data suplier yang terdaftar.</TableCell></TableRow>
                    ) : (
                      sortedSuppliers.map((s) => (
                        <TableRow key={s.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <TableCell className="font-bold text-white py-4 px-8 group-hover:text-blue-400 transition-colors">{s.name}</TableCell>
                          <TableCell className="text-slate-400 font-medium">{s.ownerName || "-"}</TableCell>
                          <TableCell className="text-slate-400 font-medium">{s.bankName || "-"}</TableCell>
                          <TableCell className="font-mono text-sm text-slate-500 group-hover:text-slate-300 transition-colors">{s.accountNumber || "-"}</TableCell>
                          <TableCell className="text-right font-black text-emerald-400 group-hover:scale-105 transition-transform origin-right">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(s.balance)}
                          </TableCell>
                          <TableCell className="text-right py-4 px-8">
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-blue-400 hover:bg-blue-400/10 font-bold text-xs">Kelola</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashiers">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Kasir</CardTitle>
                <CardDescription>Daftar kasir yang memiliki akses ke sistem.</CardDescription>
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
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nama Kasir</Label>
                      <Input
                        id="name"
                        placeholder="Contoh: Somad"
                        value={newCashier.name}
                        onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="code">Kode Kasir</Label>
                      <Input
                        id="code"
                        placeholder="KSR001"
                        value={newCashier.code}
                        onChange={(e) => setNewCashier({ ...newCashier, code: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCashierDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleAddCashier} className="bg-purple-600 hover:bg-purple-700">Simpan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => requestCashierSort('name')} className="cursor-pointer hover:text-primary transition-colors">
                        Nama Kasir {getSortIcon(cashierSortConfig, 'name')}
                      </TableHead>
                      <TableHead onClick={() => requestCashierSort('code')} className="cursor-pointer hover:text-primary transition-colors">
                        Kode {getSortIcon(cashierSortConfig, 'code')}
                      </TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8">Memuat data...</TableCell></TableRow>
                    ) : sortedCashiers.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Tidak ada data kasir.</TableCell></TableRow>
                    ) : (
                      sortedCashiers.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.code}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-purple-500">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
