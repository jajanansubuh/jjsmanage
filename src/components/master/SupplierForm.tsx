import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SupplierAddFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function SupplierAddForm({ onSave, onCancel }: SupplierAddFormProps) {
  const [data, setData] = useState({ name: "", ownerName: "", bankName: "", accountNumber: "" });

  return (
    <>
      <div className="grid gap-5 py-6">
        <div className="grid gap-2.5">
          <Label htmlFor="name" className="text-slate-300 font-bold ml-1">Nama UMKM</Label>
          <Input
            id="name"
            placeholder="Contoh: Abang"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="ownerName" className="text-slate-300 font-bold ml-1">Nama Pemilik</Label>
          <Input
            id="ownerName"
            placeholder="Contoh: Bpk. Ucup"
            value={data.ownerName}
            onChange={(e) => setData({ ...data, ownerName: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="bankName" className="text-slate-300 font-bold ml-1">Nama Bank</Label>
          <Input
            id="bankName"
            placeholder="Contoh: BCA, Mandiri, dll"
            value={data.bankName}
            onChange={(e) => setData({ ...data, bankName: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="accountNumber" className="text-slate-300 font-bold ml-1">No Rekening</Label>
          <Input
            id="accountNumber"
            placeholder="Contoh: 1234567890"
            value={data.accountNumber}
            onChange={(e) => setData({ ...data, accountNumber: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
      </div>
      <DialogFooter className="gap-3 sm:gap-0">
        <Button variant="ghost" onClick={onCancel} className="h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold">Batal</Button>
        <Button onClick={() => onSave(data)} className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20">Simpan Suplier</Button>
      </DialogFooter>
    </>
  );
}

interface SupplierEditFormProps {
  supplier: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function SupplierEditForm({ supplier, onUpdate, onDelete, onCancel }: SupplierEditFormProps) {
  const [data, setData] = useState(supplier);

  const handleCreateAccount = async () => {
    try {
      const username = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const password = username + "123";
      
      const res = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          name: data.name,
          role: "SUPPLIER",
          supplierId: data.id
        }),
        headers: { "Content-Type": "application/json" }
      });
      
      const responseData = await res.json();
      
      if (res.ok) {
        toast.success("Akun berhasil dibuat!", {
          description: `Username: ${username} | Password: ${password}`
        });
      } else {
        toast.error(responseData.error || "Gagal membuat akun");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <>
      <div className="grid gap-5 py-6">
        <div className="grid gap-2.5">
          <Label htmlFor="edit-name" className="text-slate-300 font-bold ml-1">Nama UMKM</Label>
          <Input
            id="edit-name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="edit-ownerName" className="text-slate-300 font-bold ml-1">Nama Pemilik</Label>
          <Input
            id="edit-ownerName"
            value={data.ownerName || ""}
            onChange={(e) => setData({ ...data, ownerName: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="edit-bankName" className="text-slate-300 font-bold ml-1">Nama Bank</Label>
          <Input
            id="edit-bankName"
            value={data.bankName || ""}
            onChange={(e) => setData({ ...data, bankName: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="edit-accountNumber" className="text-slate-300 font-bold ml-1">No Rekening</Label>
          <Input
            id="edit-accountNumber"
            value={data.accountNumber || ""}
            onChange={(e) => setData({ ...data, accountNumber: e.target.value })}
            className="h-12 bg-slate-950/50 border-white/5 rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>

        <div className="pt-4 border-t border-white/10 mt-2">
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-12 rounded-xl border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-bold"
            onClick={handleCreateAccount}
          >
            Buat Akun Login
          </Button>
        </div>
      </div>
      <DialogFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="ghost" 
          onClick={onDelete} 
          className="h-12 rounded-xl text-red-400 hover:text-white hover:bg-red-500/10 font-bold sm:mr-auto"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Hapus
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel} className="h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold">Batal</Button>
          <Button onClick={() => onUpdate(data)} className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20">Update</Button>
        </div>
      </DialogFooter>
    </>
  );
}
