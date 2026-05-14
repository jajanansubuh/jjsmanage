import { useState } from "react";
import { Upload, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { normalizeName } from "@/app/(dashboard)/produk/hooks/use-products-data";

interface ImportProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
  onSuccess: () => void;
}

export function ImportProductDialog({
  isOpen,
  onOpenChange,
  products,
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
          const normalizedInputName = normalizeName(name?.toString());
          const existingProduct = products.find(p => normalizeName(p.name) === normalizedInputName);
          
          return {
            name: name?.toString().toUpperCase(),
            code,
            supplierId: existingProduct?.supplierId || null
          };
        }).filter(item => item.name);
        
        const uniqueItemsMap = new Map();
        formattedData.forEach(item => {
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
          toast.success(`${formattedData.length} produk berhasil diimpor/diperbarui`);
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
      <DialogContent className="bg-slate-900 border-white/10 text-white">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Upload className="w-5 h-5 text-purple-400" />
            </div>
            <span>Import <span className="text-purple-400">Produk</span></span>
          </DialogTitle>
        </DialogHeader>
        <div className="p-8 pt-0 space-y-6">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
            <p className="font-bold mb-1">Petunjuk Format Excel:</p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Gunakan kolom: <strong>Nama Barang</strong> dan <strong>Kode Barang</strong></li>
              <li>Sistem akan mencocokkan Nama Barang yang sudah ada</li>
              <li>Jika Nama Barang cocok, Kode Barang akan diperbarui</li>
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl hover:border-blue-500/50 transition-colors cursor-pointer group relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleImport}
              disabled={isImporting}
            />
            {isImporting ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-400">Memproses...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileUp className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Klik atau seret file ke sini</p>
                  <p className="text-xs text-slate-500 mt-1">XLSX, XLS, atau CSV</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
