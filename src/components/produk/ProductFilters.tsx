import { Search, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  onAdd?: () => void;
  userRole?: string | null;
}

export function ProductFilters({
  searchTerm,
  setSearchTerm,
  dateRange,
  setDateRange,
  onAdd,
  userRole
}: ProductFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="w-full lg:w-auto h-10 no-print"
        />

        <div className="relative group w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Cari nama produk..."
            className="pl-11 pr-4 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {userRole !== "SUPPLIER" && onAdd && (
          <Button
            className="w-full sm:w-auto shrink-0 whitespace-nowrap"
            onClick={onAdd}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            <span>Tambah Produk</span>
          </Button>
        )}
      </div>
    </div>
  );
}
