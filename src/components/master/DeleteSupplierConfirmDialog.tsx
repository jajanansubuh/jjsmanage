import { Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DeleteSupplierConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSupplier: any;
  deleteCredentials: any;
  setDeleteCredentials: (creds: any) => void;
  deleteError: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function DeleteSupplierConfirmDialog({
  isOpen,
  onOpenChange,
  selectedSupplier,
  deleteCredentials,
  setDeleteCredentials,
  deleteError,
  isDeleting,
  onConfirm
}: DeleteSupplierConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-3xl shadow-2xl max-w-md p-0 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white uppercase tracking-tight text-center">Hapus Suplier?</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium pt-2 text-center">
                Anda akan menghapus suplier <span className="text-white font-bold">{selectedSupplier?.name}</span>. Semua data laporan terkait suplier ini juga akan dihapus secara permanen.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username Admin</Label>
              <Input
                placeholder="Username"
                value={deleteCredentials.username}
                onChange={(e) => setDeleteCredentials({ ...deleteCredentials, username: e.target.value })}
                className="bg-white/5 border-white/5 h-12 rounded-xl focus:ring-red-500/20 focus:border-red-500/50 transition-all text-white font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</Label>
              <Input
                type="password"
                placeholder="Password"
                value={deleteCredentials.password}
                onChange={(e) => setDeleteCredentials({ ...deleteCredentials, password: e.target.value })}
                className="bg-white/5 border-white/5 h-12 rounded-xl focus:ring-red-500/20 focus:border-red-500/50 transition-all text-white font-medium"
                onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              />
            </div>
            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                {deleteError}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl text-slate-400 font-bold hover:bg-white/5"
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-600/20 active:scale-95 transition-all"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "YA, HAPUS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
