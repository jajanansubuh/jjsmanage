"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Pencil, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  Store, 
  Loader2, 
  Search,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  name: string | null;
  role: string;
  supplierId: string | null;
  supplier?: { name: string } | null;
  permissions?: string[] | any;
  createdAt: string;
}

interface Supplier {
  id: string;
  name: string;
}

const MENU_ITEMS = [
  { name: "Dashboard", href: "/" },
  { name: "Data Master", href: "/master" },
  { name: "Transaksi", href: "/transactions" },
  { name: "Setor / Saldo", href: "/deposits" },
  { name: "Tabungan", href: "/savings" },
  { name: "Produk", href: "/produk" },
  { name: "Potongan", href: "/potongan" },
  { name: "Arsip", href: "/reports" },
  { name: "Riwayat", href: "/payouts" },
  { name: "Cetak", href: "/cetak" },
  { name: "Pengaturan", href: "/settings" },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "ADMIN",
    supplierId: "",
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
    fetchSuppliers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error("Gagal memuat daftar user");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Failed to fetch suppliers");
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      name: "",
      role: "ADMIN",
      supplierId: "",
      permissions: MENU_ITEMS.map(item => item.href)
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    
    let userPerms = [];
    try {
      userPerms = Array.isArray(user.permissions) ? user.permissions : JSON.parse(user.permissions || "[]");
    } catch {
      userPerms = [];
    }

    setFormData({
      username: user.username,
      password: "", 
      name: user.name || "",
      role: user.role,
      supplierId: user.supplierId || "",
      permissions: userPerms.length > 0 ? userPerms : MENU_ITEMS.map(item => item.href)
    });
    setIsDialogOpen(true);
  };

  const togglePermission = (href: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(href)
        ? prev.permissions.filter(p => p !== href)
        : [...prev.permissions, href]
    }));
  };

  const toggleSelectAll = () => {
    const allHrefs = MENU_ITEMS.map(item => item.href);
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.length === allHrefs.length ? [] : allHrefs
    }));
  };

  const handleSave = async () => {
    if (!formData.username || (!editingUser && !formData.password)) {
      toast.error("Username dan password wajib diisi");
      return;
    }

    try {
      setIsSaving(true);
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingUser ? "User berhasil diperbarui" : "User berhasil ditambahkan");
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Terjadi kesalahan");
      }
    } catch (error) {
      toast.error("Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User berhasil dihapus");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus user");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    (user.name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Shield className="w-3 h-3" />
            ADMIN
          </div>
        );
      case "CASHIER":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <UserIcon className="w-3 h-3" />
            KASIR
          </div>
        );
      case "SUPPLIER":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <Store className="w-3 h-3" />
            SUPLIER
          </div>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-black border border-slate-500/20">{role}</span>;
    }
  };

  return (
    <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <CardTitle className="flex items-center text-2xl font-black text-white tracking-tight">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 mr-4">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            Manajemen User & Role
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium ml-14">Kelola akses pengguna sistem dan hak akses mereka.</CardDescription>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl gap-2 font-black uppercase tracking-widest text-xs px-6 shadow-lg shadow-blue-600/20 transition-all active:scale-95 ml-14 sm:ml-0"
        >
          <UserPlus className="w-4 h-4" />
          Tambah User
        </Button>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Cari username atau nama lengkap..." 
            className="pl-12 h-14 bg-white/5 border-white/10 text-white text-lg font-medium rounded-2xl focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Memuat database user...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tidak ada user ditemukan</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Coba gunakan kata kunci pencarian lain atau tambahkan user baru.</p>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-white/[0.01] shadow-inner">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.03]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] h-14 px-6">Identitas User</TableHead>
                    <TableHead className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] h-14 px-6">Hak Akses</TableHead>
                    <TableHead className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] h-14 px-6">Afiliasi Toko</TableHead>
                    <TableHead className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] h-14 px-6 text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <UserIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-base font-black text-white leading-tight">{user.username}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{user.name || "Administrator"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="px-6 py-4">
                        {user.role === "SUPPLIER" ? (
                          <div className="flex items-center gap-2 text-slate-300 font-medium bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 w-fit">
                            <Store className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs">{user.supplier?.name || "Toko Umum"}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 font-black opacity-30">— SISTEM UTAMA —</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-slate-400 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/30 border border-transparent rounded-xl transition-all"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:border-red-500/30 border border-transparent rounded-xl transition-all"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* Force a larger width and prevent squishing with min-width on desktop */}
        <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] p-0 overflow-hidden sm:max-w-[850px] w-[95vw] shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header Section */}
          <div className="p-8 border-b border-white/5 bg-white/[0.01] shrink-0">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                {editingUser ? <Pencil className="w-7 h-7 text-blue-400" /> : <UserPlus className="w-7 h-7 text-blue-400" />}
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase italic">
                  {editingUser ? "Edit Akses User" : "Tambah User Baru"}
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">
                  {editingUser ? "Sesuaikan profil dan izin menu sistem." : "Daftarkan pengguna baru dengan hak akses spesifik."}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Main Body - Use Flexbox for guaranteed side-by-side on desktop */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-950/40">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              
              {/* Left Side: Account Form (Fixed width on desktop) */}
              <div className="w-full lg:w-[340px] space-y-8 shrink-0">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">Identitas Login</h4>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username</Label>
                      <Input 
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="contoh: admin_toko"
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/[0.08] focus:border-blue-500/50 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nama Lengkap</Label>
                      <Input 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nama asli user"
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</Label>
                      <Input 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Role / Jabatan</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(val) => setFormData({ ...formData, role: val, supplierId: val === "SUPPLIER" ? formData.supplierId : "" })}
                      >
                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-blue-500/50">
                          <SelectValue placeholder="Pilih Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white rounded-2xl shadow-2xl p-1.5 min-w-[200px]">
                          <SelectItem value="ADMIN" className="rounded-xl focus:bg-blue-500/20 focus:text-blue-400 cursor-pointer py-3 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                <Shield className="w-3.5 h-3.5 text-blue-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black tracking-tight">ADMIN</span>
                                <span className="text-[10px] text-slate-500 font-medium tracking-normal">Akses Sistem Penuh</span>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="CASHIER" className="rounded-xl focus:bg-emerald-500/20 focus:text-emerald-400 cursor-pointer py-3 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black tracking-tight">KASIR</span>
                                <span className="text-[10px] text-slate-500 font-medium tracking-normal">Input Transaksi & Nota</span>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="SUPPLIER" className="rounded-xl focus:bg-purple-500/20 focus:text-purple-400 cursor-pointer py-3 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                                <Store className="w-3.5 h-3.5 text-purple-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black tracking-tight">SUPLIER</span>
                                <span className="text-[10px] text-slate-500 font-medium tracking-normal">Akses Laporan Penjualan</span>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.role === "SUPPLIER" && (
                      <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Afiliasi Suplier</Label>
                        <Select 
                          value={formData.supplierId} 
                          onValueChange={(val) => setFormData({ ...formData, supplierId: val })}
                        >
                          <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl">
                            <SelectValue placeholder="Pilih Suplier" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                            {suppliers.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Decorative Divider Line */}
              <div className="hidden lg:block w-px self-stretch bg-white/5" />

              {/* Right Side: Sidebar Permissions (Takes remaining space) */}
              <div className="flex-1 space-y-8 w-full min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-400">Hak Akses Menu</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleSelectAll}
                    className="h-8 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 rounded-lg px-3 transition-colors"
                  >
                    {formData.permissions.length === MENU_ITEMS.length ? "Batal Semua" : "Pilih Semua"}
                  </Button>
                </div>
                
                {/* Grid for menu items - Responsive columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => togglePermission(item.href)}
                      className={cn(
                        "flex items-center justify-between px-4 py-4 rounded-2xl border transition-all duration-200 group text-left",
                        formData.permissions.includes(item.href)
                          ? "bg-purple-500/10 border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.05)]"
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/[0.07]"
                      )}
                    >
                      <span className="text-[13px] font-bold tracking-tight truncate pr-2">{item.name}</span>
                      <div className={cn(
                        "w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 border shrink-0",
                        formData.permissions.includes(item.href)
                          ? "bg-purple-500 border-purple-400 text-white scale-100 shadow-lg shadow-purple-500/20"
                          : "bg-white/5 border-white/10 text-transparent scale-90 opacity-40 group-hover:opacity-100"
                      )}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-end gap-4 shrink-0">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)}
              className="h-12 rounded-2xl text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px] px-8 transition-all active:scale-95"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] px-12 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Proses...</span>
                </div>
              ) : (editingUser ? "Simpan Perubahan" : "Konfirmasi & Tambah")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
