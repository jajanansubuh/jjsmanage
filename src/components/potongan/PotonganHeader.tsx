import { Search, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface PotonganHeaderProps {
  deductionNoteNumber: string;
  setDeductionNoteNumber: (val: string) => void;
  deductionDate: string;
  setDeductionDate: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export function PotonganHeader({
  deductionNoteNumber,
  setDeductionNoteNumber,
  deductionDate,
  setDeductionDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchTerm,
  setSearchTerm
}: PotonganHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-2">
        <Link 
          href="/transactions" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Input Transaksi
        </Link>
        <h2 className="text-4xl font-black tracking-tight text-white">
          Input{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-orange-400">
            Potongan
          </span>
        </h2>
        <p className="text-slate-400 font-medium">
          Penginputan potongan secara kolektif per suplier untuk rentang waktu terpilih.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">No. Nota</span>
          <div className="flex items-center px-4 h-12 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner group hover:bg-slate-900/80 transition-all">
            <Input
              value={deductionNoteNumber}
              onChange={(e) => setDeductionNoteNumber(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 text-sm font-bold text-white p-0 h-auto w-32 placeholder:text-slate-600"
              placeholder="No. Nota..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nota Potongan</span>
          <div className="flex items-center gap-3 px-4 h-12 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner group hover:bg-slate-900/80 transition-all">
            <Popover>
              <PopoverTrigger className="text-sm font-bold text-white focus:outline-none flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                {format(new Date(deductionDate), "dd/MM/yy")}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="start">
                <Calendar mode="single" selected={new Date(deductionDate)} onSelect={(d) => d && setDeductionDate(format(d, "yyyy-MM-dd"))} initialFocus className="text-white" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Periode Transaksi</span>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            className="h-12 !bg-slate-900/50"
          />
        </div>

        <div className="relative group w-full md:w-56 mt-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
          <Input
            placeholder="Cari suplier..."
            className="pl-11 pr-4 h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-rose-500/20 focus:border-rose-500/50 transition-all font-medium text-white shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
