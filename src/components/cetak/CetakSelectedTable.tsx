import { useState, useEffect } from "react";
import { Trash2, Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectedPrintItem } from "@/types/cetak";

interface CetakSelectedTableProps {
  items: SelectedPrintItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  userRole: string | null;
}

const getSupplierBadgeStyles = (name?: string) => {
  if (!name) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  const sName = name.toUpperCase();
  let hash = 0;
  for (let i = 0; i < sName.length; i++) {
    hash = sName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "bg-orange-500/10 text-orange-400 border-orange-500/20"
  ];
  return colors[Math.abs(hash) % colors.length];
};

function SelectedQtyInput({
  value,
  onChange
}: {
  value: number;
  onChange: (qty: number) => void;
}) {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value + 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue);
    if (isNaN(parsed) || parsed < 1) {
      setInputValue("1");
      onChange(1);
    } else {
      setInputValue(parsed.toString());
      onChange(parsed);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div 
      className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner w-28 h-8"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= 1}
        className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors cursor-pointer"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className="w-12 h-full bg-transparent text-center font-black text-white text-xs focus:outline-none border-x border-white/5"
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export function CetakSelectedTable({
  items,
  onUpdateQty,
  onRemoveItem,
  userRole
}: CetakSelectedTableProps) {
  return (
    <div className="space-y-6 no-print">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 px-2">
          Daftar Barang Siap {userRole === "ADMIN" ? "Cetak" : "Kirim"}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900/20 rounded-2xl border border-dashed border-white/5 text-slate-500 text-sm italic">
            Belum ada barang yang dipilih.
          </div>
        ) : (
          items.map((item) => (
            <Card 
              key={item.id} 
              className="bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 group"
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider border uppercase mb-1.5 ${getSupplierBadgeStyles(item.supplierName)}`}>
                    {item.supplierName || "TANPA SUPLIER"}
                  </span>
                  <p className="font-bold text-white group-hover:text-purple-300 transition-colors truncate uppercase leading-tight">{item.name}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider text-slate-400 border border-white/5">CODE</span>
                    <span>{item.code || "—"}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between gap-3 self-stretch flex-shrink-0">
                  <SelectedQtyInput
                    value={item.qty}
                    onChange={(qty) => onUpdateQty(item.id, qty)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="h-7 px-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-500/20 text-[10px] font-black tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>HAPUS</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
