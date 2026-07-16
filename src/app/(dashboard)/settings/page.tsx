"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { User, Database, Download, Upload, Loader2, FileSpreadsheet, KeyRound, CheckCircle2, AlertCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { importDatabaseAction } from "@/lib/actions/import";
import UserManagement from "@/components/settings/UserManagement";


export default function SettingsPage() {
  const [user, setUser] = useState<{ id: string, username: string, role: string, isCredentialsChanged: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreConfirmWord, setRestoreConfirmWord] = useState("");
  const [systemStats, setSystemStats] = useState<{
    reportCount: number,
    supplierCount: number,
    cashierCount: number,
    userCount: number,
    estimatedSizeMB: string,
    status: string,
    lastActivity: string,
    databaseType: string
  } | null>(null);
  
  const [formData, setFormData] = useState({ username: "", password: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const fetchSystemStats = async () => {
    try {
      const res = await fetch("/api/system/stats");
      if (res.ok) {
        const data = await res.json();
        setSystemStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch system stats", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData(prev => ({ ...prev, username: data.username }));
      } else {
        // Fallback: get role from auth session
        const roleRes = await fetch("/api/auth/role");
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setUser({ id: "", username: roleData.username || "", role: roleData.role || "ADMIN", isCredentialsChanged: false });
        }
      }
    } catch (error) {
      // Fallback: try to get role from session
      try {
        const roleRes = await fetch("/api/auth/role");
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setUser({ id: "", username: roleData.username || "", role: roleData.role || "ADMIN", isCredentialsChanged: false });
        }
      } catch (err) {
        toast.error("Gagal memuat profil");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSystemStats();
  }, []);

  const handleSave = async () => {
    if (!formData.username) {
      toast.error("Username tidak boleh kosong");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Profil berhasil diperbarui");
        setFormData(prev => ({ ...prev, password: "" }));
        fetchProfile();
      } else {
        toast.error(result.details || result.error || "Gagal memperbarui profil");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      toast.error("Hanya file .xlsx yang diperbolehkan");
      return;
    }

    try {
      setIsImporting(true);
      toast.info("Sedang mengimport data...");

      const formData = new FormData();
      formData.append("file", file);

      const result = await importDatabaseAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengimport data");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRestoreClick = () => {
    setRestoreConfirmWord("");
    setIsRestoreModalOpen(true);
  };

  const handleRestoreConfirm = () => {
    if (restoreConfirmWord !== "PULIHKAN") {
      toast.error("Kata verifikasi salah. Proses dibatalkan.");
      return;
    }
    setIsRestoreModalOpen(false);
    setRestoreConfirmWord("");
    // Baru buka file explorer setelah konfirmasi berhasil
    zipInputRef.current?.click();
  };

  const handleRestoreZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      toast.error("Hanya file .zip hasil backup yang diperbolehkan");
      if (zipInputRef.current) zipInputRef.current.value = "";
      return;
    }

    try {
      setIsRestoring(true);
      toast.info("Sedang memulihkan database menyeluruh...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || "Database berhasil dipulihkan sepenuhnya!");
        fetchSystemStats();
      } else {
        toast.error(result.error || "Gagal memulihkan database");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memulihkan database");
    } finally {
      setIsRestoring(false);
      if (zipInputRef.current) zipInputRef.current.value = "";
    }
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      toast.info("Sedang menyiapkan backup database...");
      
      const response = await fetch("/api/backup");
      
      if (!response.ok) {
        throw new Error("Gagal mengunduh backup");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-jjs-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Backup berhasil diunduh");
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat membackup data");
    } finally {
      setIsBackingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Memuat pengaturan...</p>
      </div>
    );
  }

  const isAdmin = user?.role?.toUpperCase().includes("ADMIN");

  return (
    <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      <div className="space-y-1 sm:space-y-2 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Pengaturan {isAdmin ? "Sistem" : "Akun"}
        </h2>
        <p className="text-slate-400 font-medium text-xs sm:text-sm uppercase tracking-widest">
          {isAdmin ? "Kelola kredensial login dan data sistem Anda." : "Kelola keamanan dan akses akun suplier Anda."}
        </p>
      </div>

      {!isAdmin && user?.isCredentialsChanged && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Akun Anda sudah diperbarui dan aman.</p>
        </div>
      )}

      {!isAdmin && !user?.isCredentialsChanged && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Segera ganti username dan password bawaan admin untuk keamanan.</p>
        </div>
      )}

      <div className="grid gap-6">
        <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/2">
            <CardTitle className="flex items-center text-xl font-bold text-white">
              <KeyRound className="w-6 h-6 mr-3 text-emerald-500" /> Informasi Login
            </CardTitle>
            <CardDescription className="text-slate-400">Ubah username dan password akses sistem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-3">
              <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Username Baru</Label>
              <Input 
                id="username" 
                placeholder="Masukkan username baru" 
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-12 bg-card/40 border border-white/10 text-white font-medium focus-visible:ring-emerald-500/50 rounded-2xl transition-all" 
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Password Baru</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Masukkan password baru (kosongkan jika tidak ganti)" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 bg-card/40 border border-white/10 text-white focus-visible:ring-emerald-500/50 rounded-2xl transition-all" 
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full h-12 text-sm font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 rounded-2xl transition-all active:scale-[0.98]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : "Simpan Perubahan"}
            </Button>
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="space-y-8">
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden flex flex-col border-b-0">
              <CardHeader className="border-b border-white/5 bg-white/2 p-4 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="flex items-center text-base sm:text-2xl font-black text-white tracking-tight">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mr-2.5 sm:mr-4 shrink-0">
                        <Database className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
                      </div>
                      <span className="truncate">Ringkasan Aktivitas</span>
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-medium ml-[42px] sm:ml-14 text-xs sm:text-sm">Status database dan penyimpanan.</CardDescription>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sistem Online</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 space-y-5 sm:space-y-8">
                {/* Mobile: show system online badge */}
                <div className="sm:hidden">
                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 w-fit">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sistem Online</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-white/3 border border-white/5 hover:border-emerald-500/20 transition-all group">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 sm:mb-3 group-hover:text-emerald-400 transition-colors">Total Nota</p>
                    <p className="text-2xl sm:text-4xl font-black text-white tracking-tighter">{systemStats?.reportCount || 0}</p>
                  </div>
                  
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-white/3 border border-white/5 hover:border-emerald-500/20 transition-all group">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 sm:mb-3 group-hover:text-emerald-400 transition-colors">Penyimpanan</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-tighter">{systemStats?.estimatedSizeMB || "0.00"}</p>
                      <span className="text-xs sm:text-sm font-bold text-slate-500">MB</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-white/3 border border-white/5 hover:border-emerald-500/20 transition-all group flex flex-col justify-between">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 sm:mb-3 group-hover:text-emerald-400 transition-colors">Status DB</p>
                    <div className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                      <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-tight">{systemStats?.status || "Optimal"}</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-white/3 border border-white/5 hover:border-purple-500/20 transition-all group">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 sm:mb-3 group-hover:text-purple-400 transition-colors">Suplier</p>
                    <p className="text-2xl sm:text-4xl font-black text-purple-400 tracking-tighter">{systemStats?.supplierCount || 0}</p>
                  </div>
                </div>

                <div className="relative p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-linear-to-br from-emerald-600/10 to-teal-600/10 border border-white/10 overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="w-16 sm:w-24 h-16 sm:h-24 text-white" />
                  </div>
                  
                  <div className="relative space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Tipe Database</p>
                        <p className="text-xs sm:text-sm font-bold text-white">{systemStats?.databaseType || "PostgreSQL (Cloud Indexed)"}</p>
                      </div>
                      <div className="space-y-1 sm:text-right">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Aktifitas Terakhir</p>
                        <p className="text-xs sm:text-sm font-bold text-white">
                          {systemStats?.lastActivity 
                            ? new Date(systemStats.lastActivity).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                            : "Belum ada aktifitas"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 sm:space-y-3">
                      <div className="flex justify-between items-end gap-2">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-emerald-400">Kapasitas</p>
                        <p className="text-[10px] sm:text-xs font-black text-white shrink-0">{Math.min(100, (Number(systemStats?.estimatedSizeMB || 0) / 1024) * 100).toFixed(2)}%</p>
                      </div>
                      <div className="h-2.5 sm:h-3 w-full bg-card/40 border border-white/5 p-0.5">
                        <div 
                          className="h-full bg-linear-to-r from-emerald-500 via-emerald-400 to-teal-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" 
                          style={{ width: `${Math.max(2, Math.min(100, (Number(systemStats?.estimatedSizeMB || 0) / 1024) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider italic">
                        * Kuota standar 1,024 MB (1GB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <UserManagement />

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col">
                <CardHeader className="border-b border-white/5 bg-white/2 p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg font-bold text-white">
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2.5 sm:mr-3 text-emerald-500" /> Backup Data
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Unduh semua data (ZIP/Excel).</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center p-4 sm:pt-6 sm:px-6 sm:pb-6">
                  <Button 
                    onClick={handleBackup} 
                    disabled={isBackingUp}
                    className="w-full h-11 sm:h-12 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {isBackingUp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download ZIP
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col">
                <CardHeader className="border-b border-white/5 bg-white/2 p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg font-bold text-white">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2.5 sm:mr-3 text-purple-500" /> Import Database
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Unggah data format .xlsx saja.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center p-4 sm:pt-6 sm:px-6 sm:pb-6">
                  <input 
                    type="file" 
                    accept=".xlsx" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    className="hidden" 
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isImporting}
                    className="w-full h-11 sm:h-12 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengimport...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4" />
                        Import XLSX
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col">
                <CardHeader className="border-b border-white/5 bg-white/2 p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg font-bold text-white">
                    <Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2.5 sm:mr-3 text-emerald-500" /> Restore Database
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Unggah file backup .zip langsung.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center p-4 sm:pt-6 sm:px-6 sm:pb-6">
                  <input 
                    type="file" 
                    accept=".zip" 
                    ref={zipInputRef} 
                    onChange={handleRestoreZip} 
                    className="hidden" 
                  />
                  <Button 
                    onClick={handleRestoreClick} 
                    disabled={isRestoring}
                    className="w-full h-11 sm:h-12 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {isRestoring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memulihkan...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Restore ZIP
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      <Dialog open={isRestoreModalOpen} onOpenChange={setIsRestoreModalOpen}>
        <DialogContent className="!max-w-md !rounded-3xl !bg-card !border !border-white/10 !p-0 overflow-hidden" showCloseButton={false}>
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">Restore Database</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Tindakan ini akan <span className="text-red-400 font-bold">menghapus seluruh database saat ini</span> dan menggantinya dengan data dari file backup ZIP Anda.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15 space-y-1.5">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-wider">Peringatan</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Semua data yang belum dibackup akan <span className="text-red-400 font-semibold">hilang secara permanen</span> dan tidak dapat dikembalikan.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Ketik <span className="text-red-400 font-black">PULIHKAN</span> untuk melanjutkan
              </Label>
              <Input
                value={restoreConfirmWord}
                onChange={(e) => setRestoreConfirmWord(e.target.value)}
                placeholder="Ketik PULIHKAN di sini..."
                className="h-12 bg-white/5 border-white/10 text-white font-bold text-center text-lg tracking-widest focus-visible:ring-red-500/50 rounded-2xl transition-all placeholder:text-slate-600 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRestoreConfirm();
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 p-4 sm:p-6 border-t border-white/5 bg-white/2">
            <Button
              onClick={() => { setIsRestoreModalOpen(false); setRestoreConfirmWord(""); }}
              className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-2xl transition-all"
            >
              Batal
            </Button>
            <Button
              onClick={handleRestoreConfirm}
              disabled={restoreConfirmWord !== "PULIHKAN"}
              className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 disabled:text-red-300/30 shadow-lg shadow-red-600/20 rounded-2xl transition-all"
            >
              Pulihkan Database
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
