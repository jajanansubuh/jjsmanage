import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CetakSelectedTableProps {
  items: any[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  userRole: string | null;
}

export function CetakSelectedTable({
  items,
  onUpdateQty,
  onRemoveItem,
  userRole
}: CetakSelectedTableProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 px-2">Daftar Barang Siap {userRole === "ADMIN" ? "Cetak" : "Kirim"}</h3>
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Kode Barang</TableHead>
                <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Nama Barang</TableHead>
                <TableHead className="py-6 px-8 text-center font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Qty (Label)</TableHead>
                <TableHead className="py-6 px-8 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 no-print">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-500 font-medium italic">
                    Belum ada barang yang dipilih.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-5 px-8 font-mono text-sm text-blue-400">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-500 mb-1">{item.supplierName}</span>
                        {item.code || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <p className="font-bold text-white uppercase">{item.name}</p>
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <div className="flex justify-center">
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => onUpdateQty(item.id, parseInt(e.target.value) || 1)}
                          className="w-20 h-10 bg-slate-950/50 border-white/10 rounded-xl text-center font-bold text-white focus:ring-blue-500/20"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-right no-print">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(item.id)}
                        className="w-10 h-10 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
