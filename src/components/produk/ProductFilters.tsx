import { Search, Globe, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  onShowAll: () => void;
  isAllSelected: boolean;
  searchScope: "all" | "name" | "supplier";
  setSearchScope: (scope: "all" | "name" | "supplier") => void;
}

export function ProductFilters({
  searchTerm,
  setSearchTerm,
  dateRange,
  setDateRange,
  onShowAll,
  isAllSelected,
  searchScope,
  setSearchScope,
}: ProductFiltersProps) {
  const scopeLabels = {
    all: "Semua Kolom",
    name: "Nama Barang",
    supplier: "Supplier",
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        {/* DateRangePicker wrapper */}
        <div className={`w-full lg:w-auto ${isAllSelected ? "opacity-50 pointer-events-none" : ""}`}>
          <DateRangePicker
            dateRange={isAllSelected ? undefined : dateRange}
            onDateRangeChange={setDateRange}
            className="w-full lg:w-auto h-10 no-print"
          />
        </div>

        <Button
          onClick={onShowAll}
          variant={isAllSelected ? "default" : "outline"}
          className={`w-full sm:w-auto h-10 shrink-0 whitespace-nowrap transition-all rounded-xl cursor-pointer ${
            isAllSelected
              ? "bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-950/50"
              : "bg-slate-900/40 border-white/5 text-slate-400 hover:text-white"
          }`}
        >
          <Globe className="w-4 h-4 mr-2" />
          <span>Semua Produk (Tanpa Tanggal)</span>
        </Button>

        {/* Filter / Scope Selection & Search Box Group */}
        <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto">
          <Popover>
            <PopoverTrigger
              className="h-10 px-4 bg-slate-950/50 border border-white/5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-2 whitespace-nowrap text-xs font-bold transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cari di: {scopeLabels[searchScope]}</span>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1.5 bg-slate-950/95 backdrop-blur-xl border border-white/10 text-white rounded-xl shadow-2xl z-50">
              <div className="space-y-1">
                {(Object.keys(scopeLabels) as Array<keyof typeof scopeLabels>).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setSearchScope(scope)}
                    className={`w-full text-left px-3 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      searchScope === scope
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {scopeLabels[scope]}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-400 transition-colors" />
            <Input
              placeholder={
                searchScope === "name"
                  ? "Cari nama barang..."
                  : searchScope === "supplier"
                  ? "Cari nama supplier..."
                  : "Cari produk..."
              }
              className="pl-11 pr-4 w-full h-10 border-white/5 focus:ring-emerald-500/20 focus:border-emerald-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
