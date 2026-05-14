import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRef } from "react";

interface ImportExcelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImportExcelDialog({
  isOpen,
  onOpenChange,
  onImport
}: ImportExcelDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl max-w-md p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Upload className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-black text-white">Import dari Excel</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium mt-2">
              Pilih file .xlsx hasil export rekapan untuk diimport secara otomatis.
            </DialogDescription>
          </div>
          <div className="w-full space-y-3">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">Sistem akan mencocokkan Nama Suplier secara otomatis (Fuzzy Match).</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">Suplier yang tidak ditemukan akan ditandai dengan warna merah untuk dipilih manual.</p>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              onImport(e);
              onOpenChange(false);
            }}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
          >
            PILIH FILE EXCEL
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 font-bold">Batal</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
