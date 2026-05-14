"use client";

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";

// Hooks
import { useProductsData, AggregatedProduct } from "./hooks/use-products-data";

// Components
import { ProductHeader } from "@/components/produk/ProductHeader";
import { ProductStats } from "@/components/produk/ProductStats";
import { ProductFilters } from "@/components/produk/ProductFilters";
import { ProductTable } from "@/components/produk/ProductTable";

// Dialogs
import { AddProductDialog } from "@/components/produk/AddProductDialog";
import { ImportProductDialog } from "@/components/produk/ImportProductDialog";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<any>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof AggregatedProduct; direction: "asc" | "desc" } | null>({ key: "totalJual", direction: "desc" });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { loading, error, products, suppliers, role, refresh } = useProductsData(dateRange);

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
          return sortConfig.direction === "asc" ? valA! - valB! : valB! - valA!;
        }

        return 0;
      });
    }

    return result;
  }, [products, searchTerm, sortConfig]);

  const stats = useMemo(() => {
    const totalSoldRaw = products.reduce((acc, p) => acc + p.totalJual, 0);
    return {
      totalItems: products.length,
      totalSold: totalSoldRaw.toFixed(2),
      avgSellRate: products.length > 0
        ? (products.reduce((acc, p) => acc + (p.totalBeli > 0 ? (p.totalJual / p.totalBeli) * 100 : 0), 0) / products.length).toFixed(1)
        : "0"
    };
  }, [products]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const dataToExport = products.map(p => ({
        "Kode Barang": p.code || "",
        "Nama Barang": p.name,
        "Suplier": p.supplierName || "Tanpa Suplier",
        "Total Beli": p.totalBeli,
        "Total Jual": p.totalJual,
        "Reture Jual": p.totalRetureJual,
        "Persentase": ((p.totalJual / (p.totalBeli || 1)) * 100).toFixed(1) + "%"
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Produk");
      XLSX.writeFile(wb, `Katalog_Produk_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Data berhasil diekspor");
    } catch (err) {
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1800px] mx-auto pb-10 px-4">
      <ProductHeader 
        onExport={handleExport}
        onImport={() => setIsImportOpen(true)}
        onAdd={() => setIsAddOpen(true)}
        isExporting={isExporting}
        userRole={role}
      />

      <ProductStats stats={stats} />

      <ProductFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateRange={dateRange}
        setDateRange={setDateRange}
        isCalendarOpen={isCalendarOpen}
        setIsCalendarOpen={setIsCalendarOpen}
      />

      <ProductTable 
        products={filteredProducts}
        onSort={handleSort}
      />

      <AddProductDialog 
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        suppliers={suppliers}
        onSuccess={refresh}
      />

      <ImportProductDialog 
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        products={products}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
