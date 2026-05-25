import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ConfirmDoneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
}

export function ConfirmDoneDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Tandai Selesai?",
  description = "Apakah Anda ingin menandai semua barang di antrean ini sebagai 'Selesai'?",
  confirmText = "YA, SELESAI"
}: ConfirmDoneDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-3xl shadow-2xl max-w-sm p-0 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white uppercase tracking-tight text-center">{title}</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium pt-2 text-center">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl text-slate-400 font-bold hover:bg-white/5 text-xs uppercase tracking-wider"
          >
            Batal
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
