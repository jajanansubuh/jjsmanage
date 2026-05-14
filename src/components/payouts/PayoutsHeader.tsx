import { ArrowLeft, Search, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Link from "next/link";

interface PayoutsHeaderProps {
  userRole: string | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedMonth: Date | undefined;
  setSelectedMonth: (val: Date | undefined) => void;
}

export function PayoutsHeader({
  userRole,
  searchTerm,
  setSearchTerm,
  selectedMonth,
  setSelectedMonth
}: PayoutsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Finansial</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Riwayat <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-orange-400">Transaksi</span>
        </h2>
        <p className="text-slate-400 text-sm md:text-base font-medium">Seluruh riwayat transaksi consignment yang diinput oleh Admin.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5 w-full sm:w-auto">
          <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group flex-1 sm:flex-none">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bulan</span>
              <Popover>
                <PopoverTrigger className="flex items-center gap-2 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto bg-transparent border-none">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  {selectedMonth ? format(selectedMonth, "MMMM yyyy", { locale: id }) : "Semua"}
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] md:w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="end">
                  <Calendar mode="single" selected={selectedMonth} onSelect={setSelectedMonth} initialFocus className="text-white" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {selectedMonth && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(undefined)} className="text-xs text-slate-400 hover:text-white px-2 rounded-xl">Reset</Button>
          )}
        </div>

        <div className="relative group w-full md:w-56">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
          <Input 
            placeholder={userRole === "SUPPLIER" ? "Cari nota..." : "Cari nota/catatan..."} 
            className="pl-11 pr-4 h-11 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-amber-500/20 focus:border-amber-500/50 transition-all font-medium text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
