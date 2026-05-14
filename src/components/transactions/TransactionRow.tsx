"use client";

import { memo } from "react";
import { Trash2, Calculator, Plus } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SupplierCombobox } from "./SupplierCombobox";
import { Table, TableBody, TableHead, TableHeader } from "@/components/ui/table";

interface ReportRow {
  id: string;
  supplierId: string;
  revenue: number;
  barcode: number;
  cost: number;
  serviceCharge: number;
  kukuluban: number;
  tabungan: number;
  profit80: number;
  profit20: number;
  items?: { name: string; qtyBeli: number; qtyJual: number; retureJual: number }[];
  importedSupplierName?: string;
}

interface TransactionRowProps {
  row: ReportRow;
  index: number;
  suppliers: any[];
  onUpdateField: (id: string, field: keyof ReportRow, value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => void;
  onRemove: (index: number) => void;
}

export const TransactionRow = memo(({
  row,
  index,
  suppliers,
  onUpdateField,
  onKeyDown,
  onRemove
}: TransactionRowProps) => {
  const currentSupplier = suppliers.find(s => s.id === row.supplierId);

  return (
    <TableRow key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
      <TableCell className="font-medium text-slate-500 py-3 px-2 text-[11px]">{index + 1}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="font-bold text-white print:text-black min-w-[150px]">
            {currentSupplier ? (
              row.items && row.items.length > 0 ? (
                <Dialog>
                  <DialogTrigger className="cursor-pointer hover:text-blue-400 transition-colors border-b border-dashed border-white/20 pb-0.5 flex items-center gap-2 group/text bg-transparent border-0 p-0 text-white font-bold h-auto">
                    {currentSupplier.name}
                    <Plus className="w-3 h-3 text-white/20 group-hover/text:text-blue-400 transition-colors" />
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl p-0 overflow-hidden rounded-3xl shadow-2xl">
                    <div className="p-8 bg-gradient-to-br from-blue-600/20 to-transparent border-b border-white/5">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                          <Calculator className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-black tracking-tight">Rincian Produk</DialogTitle>
                          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Suplier: {currentSupplier.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          <Table>
                            <TableHeader className="sticky top-0 bg-slate-900 z-10">
                              <TableRow className="border-white/5 bg-white/5">
                                <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest py-4">Nama Barang</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest py-4">Qty Beli</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest py-4">Qty Jual</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {row.items.map((item, idx) => (
                                <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02]">
                                  <TableCell className="font-bold text-slate-200 py-4">{item.name}</TableCell>
                                  <TableCell className="text-center font-black text-slate-400">{item.qtyBeli}</TableCell>
                                  <TableCell className="text-center font-black text-emerald-400">{item.qtyJual}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                currentSupplier.name
              )
            ) : (
              <div className="space-y-2">
                {row.importedSupplierName && (
                  <div className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded-sm inline-block">
                    Import: {row.importedSupplierName}
                  </div>
                )}
                <SupplierCombobox
                  value={row.supplierId}
                  onValueChange={(val) => {
                    onUpdateField(row.id, "supplierId", val);
                  }}
                  suppliers={suppliers}
                />
              </div>
            )}
          </div>
          {row.items && row.items.length > 0 && (
            <div className="text-[9px] text-blue-400/60 font-medium uppercase tracking-tighter">
              {row.items.length} Produk Terlampir
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right p-2">
        <Input
          type="text"
          value={row.revenue ? new Intl.NumberFormat("id-ID").format(row.revenue) : "0"}
          onChange={(e) => onUpdateField(row.id, "revenue", e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index, "revenue")}
          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
        />
      </TableCell>
      <TableCell className="text-right p-2">
        <Input
          type="text"
          value={row.cost ? new Intl.NumberFormat("id-ID").format(row.cost) : "0"}
          onChange={(e) => onUpdateField(row.id, "cost", e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index, "cost")}
          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
        />
      </TableCell>
      <TableCell className="text-right p-2">
        <Input
          type="text"
          value={row.barcode ? new Intl.NumberFormat("id-ID").format(row.barcode) : "0"}
          onChange={(e) => onUpdateField(row.id, "barcode", e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index, "barcode")}
          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
        />
      </TableCell>
      <TableCell className="text-right font-semibold text-white/70 print:text-black">
        {new Intl.NumberFormat("id-ID").format(row.profit80)}
      </TableCell>
      <TableCell className="text-right font-bold text-emerald-400 print:text-black">
        {new Intl.NumberFormat("id-ID").format(row.profit20)}
      </TableCell>
      <TableCell className="no-print px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="w-8 h-8 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

TransactionRow.displayName = "TransactionRow";
