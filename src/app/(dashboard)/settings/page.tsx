"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Database, Download, Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { importDatabaseAction } from "@/lib/actions/import";
import { useRef } from "react";

export default function SettingsPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    toast.success("Pengaturan berhasil disimpan");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if xlsx
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
      a.download = "backup-jjs-manage.zip";
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto pb-20">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white">
          Pengaturan <span className="text-blue-500">Sistem</span>
        </h2>
        <p className="text-slate-400 font-medium text-sm uppercase tracking-widest">Kelola kredensial login dan data sistem Anda.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="flex items-center text-xl font-bold text-white">
              <User className="w-6 h-6 mr-3 text-blue-500" /> Informasi Login
            </CardTitle>
            <CardDescription className="text-slate-400">Ubah username dan password akses sistem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-3">
              <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Username</Label>
              <Input id="username" placeholder="Masukkan username" defaultValue="admin" className="h-12 bg-white/5 border-white/10 text-white font-medium focus-visible:ring-blue-500/50 rounded-2xl" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Password</Label>
              <Input id="password" type="password" placeholder="Masukkan password" defaultValue="password" className="h-12 bg-white/5 border-white/10 text-white focus-visible:ring-blue-500/50 rounded-2xl" />
            </div>
            <Button onClick={handleSave} className="w-full h-12 text-sm font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 rounded-2xl transition-all active:scale-[0.98]">
              Simpan Perubahan
            </Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="flex items-center text-lg font-bold text-white">
                <Download className="w-5 h-5 mr-3 text-emerald-500" /> Backup Data
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Unduh semua data (ZIP/Excel).</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center pt-6">
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
            <CardContent className="flex-1 flex flex-col justify-center pt-6">
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
      </div>
    </div>
  );
}
