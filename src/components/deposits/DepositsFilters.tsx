import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Filter, Search, CheckCircle2, Printer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { DepositItem } from "@/app/(dashboard)/deposits/hooks/use-deposits-data";

interface DepositsFiltersProps {
  role: string | null;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  bankFilter: string;
  setBankFilter: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filteredAndSortedData: DepositItem[];
  onValidateAllClick: () => void;
  onPrintClick: () => void;
}

export function DepositsFilters({
  role,
  dateRange,
  setDateRange,
  bankFilter,
  setBankFilter,
  searchTerm,
  setSearchTerm,
  filteredAndSortedData,
  onValidateAllClick,
  onPrintClick
}: DepositsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 bg-slate-900/50 p-3 rounded-2xl md:rounded-[2rem] border border-white/5 backdrop-blur-md lg:grid lg:grid-cols-12 lg:items-center">
      {/* Date Filter */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-2 bg-slate-950/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group cursor-pointer h-14",
        role === "SUPPLIER" ? "lg:col-span-12" : "lg:col-span-3"
      )}>
        <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
          <CalendarIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rentang Tanggal</span>
          <Popover>
            <PopoverTrigger className="flex items-center gap-2 text-sm font-bold text-white focus:outline-none p-0 h-auto bg-transparent border-none w-full text-left">
              {dateRange?.from ? (
                dateRange.to ? (
                  <span className="truncate">
                    {format(dateRange.from, "dd MMM", { locale: localeId })} - {format(dateRange.to, "dd MMM yyyy", { locale: localeId })}
                  </span>
                ) : (
                  format(dateRange.from, "dd MMM yyyy", { locale: localeId })
                )
              ) : (
                <span>Pilih Tanggal</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] md:w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                className="text-white"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {role !== "SUPPLIER" && (
        <>
          {/* Bank Filter */}
          <div className="lg:col-span-2 flex items-center gap-3 px-4 py-2 bg-slate-950/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group h-14">
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Filter className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Metode</span>
              <Select value={bankFilter} onValueChange={(val) => val && setBankFilter(val)}>
                <SelectTrigger className="h-auto p-0 bg-transparent border-none text-sm font-bold text-white focus:ring-0 w-full hover:bg-transparent data-placeholder:text-slate-500">
                  <SelectValue placeholder="Pilih Filter" />
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false} className="bg-slate-900/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl p-1.5 shadow-2xl z-[100] min-w-[200px]">
                  <SelectItem value="ALL" className="rounded-xl py-2.5 focus:bg-white/10 focus:text-white transition-colors">Semua Pembayaran</SelectItem>
                  <SelectItem value="CASH" className="rounded-xl py-2.5 focus:bg-white/10 focus:text-white transition-colors">Cash / Tunai</SelectItem>
                  <SelectItem value="BANK" className="rounded-xl py-2.5 focus:bg-white/10 focus:text-white transition-colors">Transfer Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="lg:col-span-3 relative group h-14">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <Input
              placeholder="Cari UMKM..."
              className="w-full h-full pl-12 pr-4 bg-slate-950/40 border-white/5 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold text-white placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <Button
              onClick={onValidateAllClick}
              disabled={filteredAndSortedData.filter(i => !i.isValidated).length === 0}
              className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider shadow-lg shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50 gap-2 text-xs md:text-sm"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" /> <span className="truncate">Validasi Semua</span>
            </Button>
            <Button
              onClick={onPrintClick}
              disabled={filteredAndSortedData.length === 0}
              className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 gap-2 text-xs md:text-sm"
            >
              <Printer className="w-5 h-5 shrink-0" /> <span className="truncate">Cetak</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
