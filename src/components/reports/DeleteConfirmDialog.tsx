import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deleteNoteNumber: string | null;
  deleteCredentials: any;
  setDeleteCredentials: (val: any) => void;
  deleteError: string;
  isDeleting: boolean;
  onDelete: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  deleteNoteNumber,
  deleteCredentials,
  setDeleteCredentials,
  deleteError,
  isDeleting,
  onDelete
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-3xl max-w-md">
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20"><ShieldAlert className="w-8 h-8 text-red-500" /></div>
            <DialogHeader><DialogTitle className="text-xl font-black text-white">Hapus Nota?</DialogTitle></DialogHeader>
            <p className="text-slate-400">Masukkan kredensial admin untuk menghapus nota <strong>{deleteNoteNumber}</strong>.</p>
          </div>
          <div className="space-y-4 text-white">
            <Input placeholder="Username Admin" value={deleteCredentials.username} onChange={(e) => setDeleteCredentials({ ...deleteCredentials, username: e.target.value })} className="bg-white/5 border-white/5 h-12" />
            <Input type="password" placeholder="Password" value={deleteCredentials.password} onChange={(e) => setDeleteCredentials({ ...deleteCredentials, password: e.target.value })} className="bg-white/5 border-white/5 h-12" onKeyDown={(e) => e.key === "Enter" && onDelete()} />
            {deleteError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">{deleteError}</div>}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 text-slate-400 font-bold">Batal</Button>
            <Button onClick={onDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black">{isDeleting ? "..." : "HAPUS"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
