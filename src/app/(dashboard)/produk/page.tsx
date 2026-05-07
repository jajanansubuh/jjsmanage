"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Package,
  Search,
  ArrowUpDown,
  AlertCircle,
  TrendingUp,
  History,
  Box,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductItem {
  name: string;
  qtyBeli: number;
  qtyJual: number;
  retureJual: number;
}

interface AggregatedProduct {
  name: string;
  totalBeli: number;
  totalJual: number;
  totalRetureJual: number;
  transactions: number;
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<AggregatedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof AggregatedProduct; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/reports?limit=5000'); // Fetch a large batch to get all history
        if (!res.ok) throw new Error("Gagal mengambil data laporan produk");
        
        const data = await res.json();
        const reports = data.reports || [];

        // Aggregate items from all reports
        const productMap = new Map<string, AggregatedProduct>();

        reports.forEach((report: any) => {
          const items = report.items || [];
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const name = (item.name || '').trim();
              if (!name) return;

              if (productMap.has(name)) {
                const existing = productMap.get(name)!;
                existing.totalBeli += Number(item.qtyBeli) || 0;
                existing.totalJual += Number(item.qtyJual) || 0;
                existing.totalRetureJual += (item.retureJual != null && !isNaN(Number(item.retureJual))) ? Number(item.retureJual) : 0;
                existing.transactions += 1;
              } else {
                productMap.set(name, {
                  name: name,
                  totalBeli: Number(item.qtyBeli) || 0,
                  totalJual: Number(item.qtyJual) || 0,
                  totalRetureJual: (item.retureJual != null && !isNaN(Number(item.retureJual))) ? Number(item.retureJual) : 0,
                  transactions: 1
                });
              }
            });
          }
        });

        setProducts(Array.from(productMap.values()));
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSort = (key: keyof AggregatedProduct) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === "asc" 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        
        return 0;
      });
    }

    return result;
  }, [products, searchTerm, sortConfig]);

  const stats = useMemo(() => {
    return {
      totalItems: products.length,
      totalSold: products.reduce((acc, p) => acc + p.totalJual, 0),
      avgSellRate: products.length > 0 
        ? (products.reduce((acc, p) => acc + (p.totalBeli > 0 ? (p.totalJual / p.totalBeli) * 100 : 0), 0) / products.length).toFixed(1)
        : "0"
    };
  }, [products]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Menganalisa data produk...</p>
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
            Katalog <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Produk</span>
          </h2>
          <p className="text-slate-400 font-medium">Ringkasan performa penjualan produk Anda berdasarkan transaksi terbaru.</p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <Input
            placeholder="Cari nama produk..."
            className="pl-11 pr-4 h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-blue-500/20 transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Box className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Varian Produk</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">{stats.totalItems}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-purple-500/20 transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Total Terjual</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">{stats.totalSold} <span className="text-sm font-bold text-slate-500 ml-1">Pcs</span></h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-emerald-500/20 transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Rasio Laku</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">{stats.avgSellRate}%</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <History className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Akumulasi Stok & Penjualan</h3>
        </div>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-6 px-8 cursor-pointer group" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Nama Barang <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 text-center cursor-pointer group" onClick={() => handleSort("totalBeli")}>
                      <div className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Total Beli <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 text-center cursor-pointer group" onClick={() => handleSort("totalJual")}>
                      <div className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Total Jual <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 text-center cursor-pointer group" onClick={() => handleSort("totalRetureJual")}>
                      <div className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                        Reture Jual <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </TableHead>
                    <TableHead className="py-6 px-8 text-right">
                      <div className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Persentase Laku
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-24 text-slate-500 font-medium italic">
                        Belum ada data produk yang tercatat.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product, idx) => {
                      const sellRate = product.totalBeli > 0 
                        ? ((product.totalJual / product.totalBeli) * 100).toFixed(1)
                        : "0";
                      
                      return (
                        <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02] transition-all duration-300 group">
                          <TableCell className="py-6 px-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-all">
                                <Package className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                              </div>
                              <span className="font-black text-lg text-white tracking-tight group-hover:text-blue-400 transition-colors">
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-slate-400 text-lg">
                              {product.totalBeli}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-black text-xl text-emerald-400">
                              {product.totalJual}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-lg text-rose-400">
                              {product.totalRetureJual}
                            </span>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-xl text-white tracking-tighter">
                                {sellRate}%
                              </span>
                              <div className="w-24 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className="h-full bg-linear-to-r from-blue-500 to-emerald-500" 
                                  style={{ width: `${Math.min(100, Number(sellRate))}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
