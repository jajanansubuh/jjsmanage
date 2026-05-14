import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmValidateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isValidatingAll: boolean;
  unvalidatedIdsCount: number;
  onConfirm: () => void;
}

export function ConfirmValidateDialog({
  isOpen,
  onOpenChange,
  isValidatingAll,
  unvalidatedIdsCount,
  onConfirm
}: ConfirmValidateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isValidatingAll && onOpenChange(open)}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-400">
            <AlertCircle className="w-5 h-5" /> Konfirmasi Validasi Massal
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Anda yakin ingin memvalidasi <span className="font-bold text-white">{unvalidatedIdsCount} UMKM</span> sekaligus? Tindakan ini akan menambahkan saldo ke masing-masing UMKM dan mengubah status menjadi tervalidasi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-2 sm:justify-end border-t border-white/10 pt-4 bg-transparent">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isValidatingAll}
            className="bg-transparent border-white/20 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isValidatingAll}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 min-w-[120px]"
          >
            {isValidatingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Ya, Validasi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
