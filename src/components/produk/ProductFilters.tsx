import { Search, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
}

import { useState, useEffect } from "react";

export function ProductFilters({
  searchTerm,
  setSearchTerm,
  dateRange,
  setDateRange,
  isCalendarOpen,
  setIsCalendarOpen
}: ProductFiltersProps) {
  const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>(dateRange);

  useEffect(() => {
    if (isCalendarOpen) {
      setLocalDateRange(dateRange);
    }
  }, [isCalendarOpen, dateRange]);
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5 no-print w-full lg:w-auto">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors group cursor-pointer w-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Periode Laporan</span>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger className="flex items-center gap-2 text-sm font-bold text-white focus:outline-none p-0 h-auto bg-transparent border-none hover:text-blue-400 transition-colors cursor-pointer">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
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
                <PopoverContent className="w-[calc(100vw-2rem)] md:w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={localDateRange?.from || dateRange?.from}
                    selected={localDateRange}
                    onSelect={setLocalDateRange}
                    numberOfMonths={1}
                    className="text-white"
                  />
                  <div className="p-3 border-t border-white/10 flex justify-end bg-slate-950/50">
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6"
                      onClick={() => {
                        setDateRange(localDateRange);
                        setIsCalendarOpen(false);
                      }}
                    >
                      OK
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="relative group w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <Input
            placeholder="Cari nama produk..."
            className="pl-11 pr-4 h-14 lg:h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-white placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
