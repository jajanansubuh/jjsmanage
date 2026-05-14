import { ArrowUpDown, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AggregatedProduct } from "@/app/(dashboard)/produk/hooks/use-products-data";
import { cn } from "@/lib/utils";

interface ProductTableProps {
  products: AggregatedProduct[];
  onSort: (key: keyof AggregatedProduct) => void;
}

export function ProductTable({ products, onSort }: ProductTableProps) {
  return (
    <div className="space-y-4 px-4 md:px-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <History className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white">Akumulasi Stok & Penjualan</h3>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 bg-white/[0.02]">
              <TableHead className="w-12 text-center py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Kode</TableHead>
              <TableHead className="py-5">
                <Button variant="ghost" onClick={() => onSort("name")} className="p-0 h-auto font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-transparent hover:text-white flex items-center gap-2">
                  Nama Barang <ArrowUpDown className="w-3 h-3" />
                </Button>
              </TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Suplier</TableHead>
              <TableHead className="text-center py-5">
                <Button variant="ghost" onClick={() => onSort("totalBeli")} className="p-0 h-auto font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-transparent hover:text-white flex items-center gap-2 mx-auto">
                  Total Beli <ArrowUpDown className="w-3 h-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center py-5">
                <Button variant="ghost" onClick={() => onSort("totalJual")} className="p-0 h-auto font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-transparent hover:text-white flex items-center gap-2 mx-auto">
                  Total Jual <ArrowUpDown className="w-3 h-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Reture</TableHead>
              <TableHead className="text-right px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Rasio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <p className="text-slate-500 font-medium italic">Belum ada data produk dalam periode ini.</p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, idx) => (
                <ProductTableRow key={idx} product={product} index={idx} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {products.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
            <p className="text-slate-500 font-medium italic">Belum ada data produk.</p>
          </div>
        ) : (
          products.map((product, idx) => {
            const sellRate = product.totalBeli > 0 ? ((product.totalJual / product.totalBeli) * 100).toFixed(1) : "0";
            return (
              <div key={idx} className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{product.code || "TANPA KODE"}</p>
                    <h4 className="font-bold text-white leading-tight">{product.name}</h4>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">{product.supplierName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">{sellRate}%</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Rasio</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Beli</p>
                    <p className="font-bold text-white">{product.totalBeli}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Jual</p>
                    <p className="font-bold text-emerald-400">{product.totalJual}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Retur</p>
                    <p className="font-bold text-rose-400">{product.totalRetureJual}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ProductTableRow({ product, index }: { product: AggregatedProduct; index: number }) {
  const sellRate = product.totalBeli > 0 ? ((product.totalJual / product.totalBeli) * 100).toFixed(1) : "0";
  
  return (
    <TableRow className="border-white/5 hover:bg-white/[0.02] transition-colors group">
      <TableCell className="text-center font-bold text-slate-500 py-5">{index + 1}</TableCell>
      <TableCell className="font-mono text-[10px] text-blue-400/70 font-bold">{product.code || "-"}</TableCell>
      <TableCell className="font-black text-white py-5">{product.name}</TableCell>
      <TableCell className="font-bold text-slate-500 text-[11px] uppercase tracking-tighter">{product.supplierName}</TableCell>
      <TableCell className="text-center font-bold text-slate-400">{product.totalBeli}</TableCell>
      <TableCell className="text-center font-black text-emerald-400 text-lg">{product.totalJual}</TableCell>
      <TableCell className="text-center font-bold text-rose-400">{product.totalRetureJual}</TableCell>
      <TableCell className="text-right px-8">
        <div className="flex flex-col items-end">
          <span className="font-black text-white">{sellRate}%</span>
          <div className="w-16 h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                Number(sellRate) > 80 ? "bg-emerald-500" : Number(sellRate) > 50 ? "bg-blue-500" : "bg-rose-500"
              )} 
              style={{ width: `${Math.min(100, Number(sellRate))}%` }} 
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
