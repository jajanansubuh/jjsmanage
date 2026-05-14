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

export function ProductFilters({
  searchTerm,
  setSearchTerm,
  dateRange,
  setDateRange,
  isCalendarOpen,
  setIsCalendarOpen
}: ProductFiltersProps) {
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
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="end">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-2 border-r border-white/5 flex flex-col gap-1 bg-white/[0.02]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start font-bold text-[10px] uppercase tracking-wider hover:bg-blue-500/10 hover:text-blue-400"
                        onClick={() => {
                          setDateRange({ from: new Date(), to: new Date() });
                          setIsCalendarOpen(false);
                        }}
                      >
                        Hari Ini
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start font-bold text-[10px] uppercase tracking-wider hover:bg-blue-500/10 hover:text-blue-400"
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setDate(start.getDate() - 7);
                          setDateRange({ from: start, to: end });
                          setIsCalendarOpen(false);
                        }}
                      >
                        7 Hari Terakhir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start font-bold text-[10px] uppercase tracking-wider hover:bg-blue-500/10 hover:text-blue-400"
                        onClick={() => {
                          const now = new Date();
                          setDateRange({
                            from: new Date(now.getFullYear(), now.getMonth(), 1),
                            to: now
                          });
                          setIsCalendarOpen(false);
                        }}
                      >
                        Bulan Ini
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start font-bold text-[10px] uppercase tracking-wider hover:bg-blue-500/10 hover:text-blue-400"
                        onClick={() => {
                          const now = new Date();
                          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                          setDateRange({ from: lastMonth, to: endOfLastMonth });
                          setIsCalendarOpen(false);
                        }}
                      >
                        Bulan Lalu
                      </Button>
                    </div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range, selectedDay) => {
                        if (dateRange?.from && dateRange?.to) {
                          setDateRange({ from: selectedDay, to: undefined });
                        } else {
                          setDateRange(range);
                        }
                        if (range?.from && range?.to) {
                          setIsCalendarOpen(false);
                        }
                      }}
                      numberOfMonths={1}
                      className="p-4 text-white"
                    />
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
