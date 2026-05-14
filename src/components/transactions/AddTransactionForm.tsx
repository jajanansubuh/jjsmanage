import { Plus, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SupplierCombobox } from "./SupplierCombobox";
import { useRef } from "react";

interface AddTransactionFormProps {
  formData: any;
  onFormNumberChange: (field: any, val: string) => void;
  onSupplierChange: (val: string) => void;
  onAdd: () => void;
  suppliers: any[];
  previewProfit80: number;
  previewProfit20: number;
  onKeyDown: (e: React.KeyboardEvent, field: string) => void;
}

export function AddTransactionForm({
  formData,
  onFormNumberChange,
  onSupplierChange,
  onAdd,
  suppliers,
  previewProfit80,
  previewProfit20,
  onKeyDown
}: AddTransactionFormProps) {
  const revenueRef = useRef<HTMLInputElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const handleRevenueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      costRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      document.getElementById("supplier-combobox-trigger")?.focus();
    }
  };

  const handleCostKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      barcodeRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      revenueRef.current?.focus();
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAdd();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      costRef.current?.focus();
    }
  };

  return (
    <Card className="border border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 items-end gap-6">
          <div className="lg:col-span-4 space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nama Suplier</Label>
            <SupplierCombobox
              id="supplier-combobox-trigger"
              value={formData.supplierId}
              onValueChange={onSupplierChange}
              suppliers={suppliers}
              onKeyDown={(e) => onKeyDown(e, "supplier")}
            />
          </div>

          <div className="lg:col-span-2 space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Pendapatan</Label>
            <Input
              id="revenue-input"
              ref={revenueRef}
              placeholder="0"
              value={formData.revenue ? new Intl.NumberFormat("id-ID").format(Number(formData.revenue)) : ""}
              onChange={(e) => onFormNumberChange("revenue", e.target.value)}
              onKeyDown={handleRevenueKeyDown}
              className="h-12 bg-white/5 border-white/10 rounded-2xl text-white font-bold focus:ring-blue-500/20"
            />
          </div>

          <div className="lg:col-span-2 space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Cost</Label>
            <Input
              ref={costRef}
              placeholder="0"
              value={formData.cost ? new Intl.NumberFormat("id-ID").format(Number(formData.cost)) : ""}
              onChange={(e) => onFormNumberChange("cost", e.target.value)}
              onKeyDown={handleCostKeyDown}
              className="h-12 bg-white/5 border-white/10 rounded-2xl text-white font-bold focus:ring-blue-500/20"
            />
          </div>

          <div className="lg:col-span-2 space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Barcode</Label>
            <Input
              ref={barcodeRef}
              placeholder="0"
              value={formData.barcode ? new Intl.NumberFormat("id-ID").format(Number(formData.barcode)) : ""}
              onChange={(e) => onFormNumberChange("barcode", e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              className="h-12 bg-white/5 border-white/10 rounded-2xl text-white font-bold focus:ring-blue-500/20"
            />
          </div>

          <div className="lg:col-span-2">
            <Button onClick={onAdd} className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xl shadow-blue-900/20 transition-all active:scale-95 group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" /> TAMBAH
            </Button>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}
