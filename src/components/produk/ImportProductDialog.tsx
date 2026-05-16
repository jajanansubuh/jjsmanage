import { useState } from "react";
import { Upload, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { normalizeName } from "@/app/(dashboard)/produk/hooks/use-products-data";
import { cn } from "@/lib/utils";

interface ImportProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
  suppliers: { id: string; name: string }[];
  onSuccess: () => void;
}

export function ImportProductDialog({
  isOpen,
  onOpenChange,
  products,
  suppliers,
  onSuccess
}: ImportProductDialogProps) {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const formattedData = jsonData.map(row => {
          const name = row["Nama Barang"] || row["name"] || row["Nama"];
          const code = row["Kode Barang"] || row["code"] || row["Kode"];
          const supplierName = row["Suplier"] || row["Supplier"] || row["suplier"] || row["supplier"];
          
          const normalizedInputName = normalizeName(name?.toString());
          
          // 1. Try to find supplierId from "Suplier" column
          let targetSupplierId = null;
          if (supplierName) {
            const normalizedSupplierName = normalizeName(supplierName.toString());
            const matchedSupplier = suppliers.find(s => normalizeName(s.name) === normalizedSupplierName);
            if (matchedSupplier) {
              targetSupplierId = matchedSupplier.id;
            }
          }

          // 2. Fallback to existing product's supplier if not found via column
          if (!targetSupplierId) {
            const existingProduct = products.find(p => normalizeName(p.name) === normalizedInputName);
            targetSupplierId = existingProduct?.supplierId || null;
          }
          
          return {
            name: name?.toString().toUpperCase(),
            code: code?.toString() || "",
            supplierId: targetSupplierId
          };
        }).filter(item => item.name);
        
        const uniqueItemsMap = new Map();
        formattedData.forEach(item => {
          // Key by name and supplierId to allow same name for different suppliers
          const key = `${normalizeName(item.name)}_${item.supplierId || 'null'}`;
          uniqueItemsMap.set(key, item);
        });
        const finalData = Array.from(uniqueItemsMap.values());

        if (finalData.length === 0) {
          toast.error("Tidak ada data valid untuk diimpor");
          return;
        }

        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalData)
        });

        if (res.ok) {
          toast.success(`${finalData.length} produk berhasil diimpor/diperbarui`);
          onOpenChange(false);
          onSuccess();
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || "Gagal menyimpan data ke server");
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal mengimpor data.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl p-0 overflow-hidden max-w-md">
        <DialogHeader className="p-8 pb-4 border-b border-white/5 bg-white/[0.02]">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-4 italic uppercase">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <span>Import <span className="text-blue-400">Katalog</span></span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-8 space-y-6">
          <div className="p-5 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/10 border border-white/5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Format Excel Wajib
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["Kode Barang", "Nama Barang", "Suplier"].map(col => (
                <div key={col} className="px-3 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-center text-slate-300">
                  {col}
                </div>
              ))}
            </div>
            <ul className="text-[11px] text-slate-400 space-y-2 font-medium pt-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Sistem mencocokkan <strong className="text-slate-200">Nama Barang</strong> & <strong className="text-slate-200">Suplier</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Jika cocok, <strong className="text-blue-400">Kode Barang</strong> akan diperbarui otomatis.</span>
              </li>
            </ul>
          </div>

          <div className="group relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleImport}
              disabled={isImporting}
            />
            <div className={cn(
              "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2rem] transition-all duration-300",
              isImporting 
                ? "bg-white/5 border-white/5" 
                : "bg-white/[0.02] border-white/10 group-hover:bg-blue-500/5 group-hover:border-blue-500/40"
            )}>
              {isImporting ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20" />
                  <p className="text-sm font-black text-blue-400 animate-pulse uppercase tracking-widest">Memproses Data...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-blue-500/20 shadow-xl">
                    <FileUp className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-black text-white uppercase tracking-widest">Pilih File Excel</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">XLSX, XLS, atau CSV</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">JjsManage • Catalog Import System v2.0</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
