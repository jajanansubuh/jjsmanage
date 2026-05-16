"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger
} from "@/components/ui/combobox";

interface Supplier {
  id: string;
  name: string;
  ownerName?: string | null;
}

interface SupplierComboboxProps {
  value: string;
  onValueChange: (val: string) => void;
  suppliers: Supplier[];
  id?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function SupplierCombobox({ 
  value, 
  onValueChange, 
  suppliers, 
  id, 
  onKeyDown 
}: SupplierComboboxProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!value) setSearch("");
  }, [value]);

  const filtered = search
    ? suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.ownerName && s.ownerName.toLowerCase().includes(search.toLowerCase())))
    : suppliers;

  return (
    <Combobox value={value} onValueChange={(val) => onValueChange(val || "")}>
      <ComboboxTrigger id={id} onKeyDown={onKeyDown} className="w-full bg-white/5 border-white/10 h-10 text-white hover:bg-white/10 transition-all">
        {suppliers.find(s => s.id === value)?.name || "Pilih Suplier"}
      </ComboboxTrigger>
      <ComboboxContent className="w-[300px] bg-slate-900/95 backdrop-blur-xl border-white/10 p-2 shadow-2xl">
        <div className="flex items-center border-b border-white/10 mb-2 px-2 pb-2">
          <Search className="w-4 h-4 mr-2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari suplier..."
            className="border-none focus-visible:outline-none h-8 p-0 bg-transparent text-white flex-1 placeholder:text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center italic">Belum ada data suplier</div>
          ) : (
            filtered.map((s) => (
              <ComboboxItem key={s.id} value={s.id} className="cursor-pointer hover:bg-blue-600/30 py-2 px-3 rounded-md transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-white">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{s.ownerName || "-"}</span>
                </div>
              </ComboboxItem>
            ))
          )}
        </div>
      </ComboboxContent>
    </Combobox>
  );
}
