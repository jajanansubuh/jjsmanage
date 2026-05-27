import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

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
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="bg-slate-950/50 border-white/5 rounded-2xl w-full lg:w-auto h-14 no-print"
        />


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
