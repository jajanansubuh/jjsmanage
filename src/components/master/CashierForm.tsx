import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface CashierAddFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function CashierAddForm({ onSave, onCancel }: CashierAddFormProps) {
  const [data, setData] = useState({ name: "", code: "" });

  return (
    <>
      <div className="grid gap-5 py-6">
        <div className="grid gap-2.5">
          <Label htmlFor="cashier-name" className="text-slate-300 font-bold ml-1">Nama Kasir</Label>
          <Input
            id="cashier-name"
            placeholder="Contoh: Siti"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="cashier-code" className="text-slate-300 font-bold ml-1">Kode Kasir</Label>
          <Input
            id="cashier-code"
            placeholder="Contoh: KSR001"
            value={data.code}
            onChange={(e) => setData({ ...data, code: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>
      <DialogFooter className="gap-3 sm:gap-0">
        <Button variant="ghost" onClick={onCancel} className="h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold">Batal</Button>
        <Button onClick={() => onSave(data)} className="h-12 px-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20">Simpan Kasir</Button>
      </DialogFooter>
    </>
  );
}
