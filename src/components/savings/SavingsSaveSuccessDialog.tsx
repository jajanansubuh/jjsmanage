import { CheckCircle2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface SavingsSaveSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  savedNoteInfo: any;
  onPrint: () => void;
  onFinish: () => void;
}

export function SavingsSaveSuccessDialog({
  isOpen,
  onOpenChange,
  savedNoteInfo,
  onPrint,
  onFinish
}: SavingsSaveSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-xl border-zinc-800 rounded-[2.5rem] shadow-2xl max-w-md p-0 overflow-hidden">
        <div className="p-10 space-y-8 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          <div className="space-y-2">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-white text-center">Tabungan Tersimpan!</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium text-lg pt-2 text-center">
                Nota Tabungan <span className="text-white font-bold">{savedNoteInfo?.noteNumber}</span> telah berhasil disimpan ke database.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={onPrint}
              className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              <Printer className="w-6 h-6 mr-3" /> CETAK NOTA TABUNGAN
            </Button>
            <Button
              variant="ghost"
              onClick={onFinish}
              className="h-14 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-lg transition-all"
            >
              Selesai
            </Button>
          </div>
        </div>

        <div className="bg-white/2 p-4 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 text-center">Jajanan Subuh • Management System</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
