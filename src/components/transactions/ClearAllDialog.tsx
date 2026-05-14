import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ClearAllDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ClearAllDialog({
  isOpen,
  onOpenChange,
  onConfirm
}: ClearAllDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl max-w-sm p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <DialogTitle className="text-xl font-black text-white">Reset Semua Data?</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium mt-2">
              Tindakan ini akan menghapus seluruh daftar transaksi yang sedang diinput. Data yang sudah disimpan di database tidak akan terpengaruh.
            </DialogDescription>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 text-slate-500 font-bold">Batal</Button>
            <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black shadow-xl shadow-red-900/20 rounded-2xl h-12">YA, RESET</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
