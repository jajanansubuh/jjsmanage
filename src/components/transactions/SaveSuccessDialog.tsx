import { CheckCircle2, Printer, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface SaveSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  savedNoteInfo: any;
  onPrint: () => void;
  onFinish: () => void;
}

export function SaveSuccessDialog({
  isOpen,
  onOpenChange,
  savedNoteInfo,
  onPrint,
  onFinish
}: SaveSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl max-w-md p-8 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-3xl font-black text-white">Berhasil Disimpan!</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-base">
              Transaksi telah berhasil dicatat ke dalam sistem.
            </DialogDescription>
          </div>
          
          <div className="w-full bg-black/40 rounded-3xl p-6 border border-white/5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nomor Nota</span>
              <span className="text-lg font-black text-blue-400">{savedNoteInfo?.noteNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tanggal</span>
              <span className="font-bold text-white">{savedNoteInfo?.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Petugas (Kasir)</span>
              <span className="font-bold text-white">{savedNoteInfo?.cashierName}</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 pt-4">
            <Button
              onClick={onPrint}
              variant="outline"
              className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black hover:bg-white/10 transition-all"
            >
              <Printer className="w-5 h-5 mr-2 text-blue-400" /> CETAK
            </Button>
            <Button
              onClick={onFinish}
              className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
            >
              SELESAI
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
