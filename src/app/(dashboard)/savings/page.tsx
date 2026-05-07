"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Coins,
  History,
  ArrowUpDown,
  TrendingUp,
  Search,
  ChevronRight,
  Wallet,
  User as UserIcon,
  Calendar,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingsDetail {
  id: string;
  date: string;
  tabungan: number;
  noteNumber: string | null;
  revenue: number;
  profit80: number;
}

interface SupplierSavings {
  id: string;
  name: string;
  ownerName: string;
  totalSavings: number;
}

export default function SavingsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<SupplierSavings[]>([]);
  const [supplierData, setSupplierData] = useState<{ total: number; history: SavingsDetail[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const roleRes = await fetch('/api/auth/role');
        if (!roleRes.ok) throw new Error("Gagal mengambil data peran user");
        const roleData = await roleRes.json();
        const normalizedRole = roleData.role?.toUpperCase();
        setRole(normalizedRole);

        const savingsRes = await fetch('/api/savings');
        if (!savingsRes.ok) {
          const errData = await savingsRes.json();
          throw new Error(errData.error || "Gagal mengambil data tabungan");
        }
        const savingsData = await savingsRes.json();

        if (normalizedRole === "SUPPLIER") {
          setSupplierData(savingsData);
        } else {
          // Ensure it's an array for admin
          setAdminData(Array.isArray(savingsData) ? savingsData : []);
        }
      } catch (err) {
        console.error("Failed to fetch savings data:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAdminData = useMemo(() => {
    if (!Array.isArray(adminData)) return [];

    let result = [...adminData].filter(
      (s) =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = (a as any)[sortConfig.key] || 0;
        const valB = (b as any)[sortConfig.key] || 0;
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [adminData, searchTerm, sortConfig]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Memuat data tabungan...</p>
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Tabungan <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">Mitra</span>
          </h2>
          <p className="text-slate-400 font-medium">Akumulasi potongan tabungan dari setiap transaksi setoran.</p>
        </div>

        {role !== "SUPPLIER" && (
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <Input
              placeholder="Cari Mitra / Pemilik..."
              className="pl-11 pr-4 h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {role === "SUPPLIER" ? (
        supplierData ? (
          <div className="grid grid-cols-1 gap-8">
            {/* Summary Card */}
            <Card className="border-white/5 bg-linear-to-br from-blue-600 to-indigo-700 overflow-hidden relative group shadow-2xl shadow-blue-500/20 rounded-[2.5rem]">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Coins size={180} className="text-white" />
              </div>
              <CardContent className="p-10 relative z-10">
                <div className="flex flex-col gap-2">
                  <span className="text-blue-100 font-black uppercase tracking-[0.2em] text-xs">Total Tabungan Terkumpul</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0
                      }).format(supplierData.total || 0)}
                    </span>
                    <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-bold">
                      <TrendingUp size={14} />
                      Auto-Save
                    </div>
                  </div>
                  <p className="mt-4 text-blue-100/70 text-sm max-w-md font-medium leading-relaxed">
                    Tabungan ini dipotong secara otomatis dari setiap omset penjualan harian Anda.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* History Table */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <History className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Riwayat Pemotongan</h3>
              </div>

              <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Tanggal</TableHead>
                          <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">No. Nota</TableHead>
                          <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Omzet</TableHead>
                          <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Bagi Hasil</TableHead>
                          <TableHead className="py-6 px-8 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Potongan Tabungan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!supplierData.history || supplierData.history.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-20 text-slate-500 font-medium italic">
                              Belum ada riwayat tabungan.
                            </TableCell>
                          </TableRow>
                        ) : (
                          supplierData.history.map((item) => (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-all duration-300 group">
                              <TableCell className="py-6 px-8">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                  <span className="font-bold text-slate-200">
                                    {format(new Date(item.date), "dd MMMM yyyy", { locale: localeId })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                                  {item.noteNumber || "-"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-slate-400 text-sm">
                                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.revenue)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-slate-400 text-sm">
                                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.profit80)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right px-8">
                                <span className="font-black text-lg text-blue-400">
                                  + {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    maximumFractionDigits: 0
                                  }).format(item.tabungan)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-[2rem] border border-white/5">
            <Coins className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-500 font-medium italic">Data tabungan tidak ditemukan.</p>
          </div>
        )
      ) : (
        /* Admin View */
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-6 px-8 cursor-pointer group" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Nama Mitra <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 cursor-pointer group" onClick={() => handleSort("ownerName")}>
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Pemilik <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 px-8 text-right cursor-pointer group" onClick={() => handleSort("totalSavings")}>
                      <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Total Tabungan <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdminData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-24 text-slate-500 font-medium italic">
                        Tidak ada data tabungan mitra.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdminData.map((item) => (
                      <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-all duration-300 group">
                        <TableCell className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <UserIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="font-black text-lg text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase">
                              {item.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                            {item.ownerName}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-xl tracking-tighter text-blue-400 transition-all duration-300 group-hover:scale-105 inline-block origin-right">
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0
                              }).format(item.totalSavings)}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                              Accumulated <TrendingUp size={10} className="text-blue-500" />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
