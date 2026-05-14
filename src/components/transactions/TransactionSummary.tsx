
interface TransactionSummaryProps {
  totals: any;
}

export function TransactionSummary({ totals }: TransactionSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-6">
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Omzet</p>
        <p className="text-xl font-black text-white">{new Intl.NumberFormat("id-ID").format(totals.revenue)}</p>
      </div>
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Cost</p>
        <p className="text-xl font-black text-slate-400">{new Intl.NumberFormat("id-ID").format(totals.cost)}</p>
      </div>
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl border-t-2 border-t-emerald-500/30">
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Mitra</p>
        <p className="text-2xl font-black text-emerald-400">{new Intl.NumberFormat("id-ID").format(totals.profit80)}</p>
      </div>
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl border-t-2 border-t-blue-500/30">
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Toko</p>
        <p className="text-2xl font-black text-blue-400">{new Intl.NumberFormat("id-ID").format(totals.profit20)}</p>
      </div>
    </div>
  );
}
