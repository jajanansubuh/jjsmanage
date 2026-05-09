"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Database, Download, Upload, Loader2, FileSpreadsheet, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { importDatabaseAction } from "@/lib/actions/import";

export default function SettingsPage() {
  const [user, setUser] = useState<{ id: string, username: string, role: string, isCredentialsChanged: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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

  useEffect(() => {
    fetchProfile();
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const res = await fetch("/api/system/stats");
      if (res.ok) {
        const data = await res.json();
        setSystemStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch system stats");
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
      } catch {
        toast.error("Gagal memuat profil");
      }
    } finally {
      setLoading(false);
    }
  };

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
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Memuat pengaturan...</p>
      </div>
    );
  }

  const isAdmin = user?.role?.toUpperCase().includes("ADMIN");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto pb-20">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-3xl font-black tracking-tight text-white">
          Pengaturan <span className="text-blue-500">{isAdmin ? "Sistem" : "Akun"}</span>
        </h2>
        <p className="text-slate-400 font-medium text-sm uppercase tracking-widest">
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
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="flex items-center text-xl font-bold text-white">
              <KeyRound className="w-6 h-6 mr-3 text-blue-500" /> Informasi Login
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
                className="h-12 bg-white/5 border-white/10 text-white font-medium focus-visible:ring-blue-500/50 rounded-2xl transition-all" 
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
                className="h-12 bg-white/5 border-white/10 text-white focus-visible:ring-blue-500/50 rounded-2xl transition-all" 
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full h-12 text-sm font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 rounded-2xl transition-all active:scale-[0.98]"
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
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col md:col-span-2 border-b-0">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center text-2xl font-black text-white tracking-tight">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 mr-4">
                        <Database className="w-6 h-6 text-blue-400" />
                      </div>
                      Ringkasan Aktivitas Sistem
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-medium ml-14">Status kesehatan database dan kapasitas penyimpanan.</CardDescription>
                  </div>
                  <div className="hidden sm:block">
                    <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sistem Online</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-blue-500/20 transition-all group">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 group-hover:text-blue-400 transition-colors">Total Nota</p>
                    <p className="text-4xl font-black text-white tracking-tighter">{systemStats?.reportCount || 0}</p>
                  </div>
                  
                  <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-blue-500/20 transition-all group">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 group-hover:text-blue-400 transition-colors">Penyimpanan</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-4xl font-black text-blue-400 tracking-tighter">{systemStats?.estimatedSizeMB || "0.00"}</p>
                      <span className="text-sm font-bold text-slate-500">MB</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-emerald-500/20 transition-all group flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 group-hover:text-emerald-400 transition-colors">Status DB</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">{systemStats?.status || "Optimal"}</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-purple-500/20 transition-all group">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 group-hover:text-purple-400 transition-colors">Suplier</p>
                    <p className="text-4xl font-black text-purple-400 tracking-tighter">{systemStats?.supplierCount || 0}</p>
                  </div>
                </div>

                <div className="relative p-8 rounded-[2.5rem] bg-linear-to-br from-blue-600/10 to-purple-600/10 border border-white/10 overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="w-24 h-24 text-white" />
                  </div>
                  
                  <div className="relative space-y-6">
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipe Database</p>
                        <p className="text-sm font-bold text-white">{systemStats?.databaseType || "PostgreSQL (Cloud Indexed)"}</p>
                      </div>
                      <div className="space-y-1 sm:text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aktifitas Terakhir</p>
                        <p className="text-sm font-bold text-white">
                          {systemStats?.lastActivity 
                            ? new Date(systemStats.lastActivity).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                            : "Belum ada aktifitas"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Kapasitas Penyimpanan</p>
                        <p className="text-xs font-black text-white">{Math.min(100, (Number(systemStats?.estimatedSizeMB || 0) / 1024) * 100).toFixed(2)}% Terpakai</p>
                      </div>
                      <div className="h-3 w-full bg-slate-950/50 rounded-full border border-white/5 p-0.5">
                        <div 
                          className="h-full bg-linear-to-r from-blue-500 via-blue-400 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" 
                          style={{ width: `${Math.max(2, Math.min(100, (Number(systemStats?.estimatedSizeMB || 0) / 1024) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider italic">
                        * Berdasarkan alokasi kuota standar 1,024 MB (1GB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden flex flex-col">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="flex items-center text-lg font-bold text-white">
                  <Download className="w-5 h-5 mr-3 text-emerald-500" /> Backup Data
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Unduh semua data (ZIP/Excel).</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center pt-6 px-6 pb-6">
                <Button 
                  onClick={handleBackup} 
                  disabled={isBackingUp}
                  className="w-full h-12 text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 rounded-2xl transition-all flex items-center justify-center gap-2"
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

            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden flex flex-col">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="flex items-center text-lg font-bold text-white">
                  <Upload className="w-5 h-5 mr-3 text-purple-500" /> Import Database
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Unggah data format .xlsx saja.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center pt-6 px-6 pb-6">
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
                  className="w-full h-12 text-xs font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20 rounded-2xl transition-all flex items-center justify-center gap-2"
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
          </div>
        )}
      </div>
    </div>
  );
}
