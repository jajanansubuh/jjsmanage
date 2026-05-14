import { Wallet, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DepositItem } from "@/app/(dashboard)/deposits/hooks/use-deposits-data";

interface DepositsSupplierSummaryProps {
  data: DepositItem[];
}

export function DepositsSupplierSummary({ data }: DepositsSupplierSummaryProps) {
  const totalDailyProfit = data.reduce((sum, item) => sum + item.dailyProfit, 0);
  const firstSupplier = (data[0] as any)?.supplier;

  return (
    <div className="animate-in slide-in-from-top-4 duration-700">
      <Card className="bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border-white/10 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] overflow-hidden relative group shadow-2xl shadow-emerald-950/20">
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Wallet className="w-32 h-32 md:w-40 md:h-40 text-emerald-400" />
        </div>
        <CardContent className="p-6 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
            <div className="space-y-4 md:space-y-6 text-center md:text-left">
              <div>
                <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] text-emerald-400/80 mb-2 md:mb-3">Total Saldo Pendapatan</p>
                <h3 className="text-3xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalDailyProfit)}
                </h3>
              </div>

              {/* Info Rekening */}
              <div className="flex flex-col gap-1 border-l-0 md:border-l-2 border-emerald-500/30 pl-0 md:pl-4 py-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Rekening Tujuan Pencairan</p>
                <p className="text-sm md:text-base font-black text-white tracking-wide uppercase">
                  {firstSupplier?.ownerName || firstSupplier?.name || "-"}
                </p>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.15em] font-mono">
                  {firstSupplier?.bankName || "-"} • {firstSupplier?.accountNumber || "-"}
                </p>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3 text-emerald-400/90 text-[10px] font-black uppercase bg-emerald-500/10 w-fit mx-auto md:mx-0 px-4 py-2 rounded-xl border border-emerald-500/20 backdrop-blur-md tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Saldo tervalidasi yang sudah ditransfer</span>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-1 md:gap-2 text-center md:text-right border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Riwayat Transaksi</p>
              <p className="text-2xl font-black text-white tracking-tight">{data.length} <span className="text-sm text-slate-500 font-bold uppercase tracking-widest">Nota</span></p>
              <div className="mt-1 md:mt-2 text-[10px] font-bold text-slate-400 flex items-center justify-center md:justify-end gap-1">
                <Clock className="w-3 h-3" /> Berdasarkan filter tanggal
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
