import { Filter, Search, CheckCircle2, Printer, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { DepositItem } from "@/app/(dashboard)/deposits/hooks/use-deposits-data";
import { DateRangePicker } from "@/components/ui/date-range-picker";

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
  onExportExcelClick: () => void;
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
  onPrintClick,
  onExportExcelClick
}: DepositsFiltersProps) {
  if (role === "SUPPLIER") return null;

  return (
    <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border lg:grid lg:grid-cols-12 lg:items-center">
      {/* Date Filter */}
      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        className={cn(
          "w-full border-white/5",
          role === "SUPPLIER" ? "lg:col-span-12" : "lg:col-span-3"
        )}
      />


      {role !== "SUPPLIER" && (
        <>
          {/* Bank Filter */}
          <div className="lg:col-span-2 flex items-center gap-3 px-4 py-2 bg-background rounded-lg border border-border hover:border-primary/50 transition-all group h-12">
            <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
              <Filter className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Metode</span>
              <Select value={bankFilter} onValueChange={(val) => val && setBankFilter(val)}>
                <SelectTrigger className="h-auto p-0 bg-transparent border-none text-sm font-bold text-white focus:ring-0 w-full hover:bg-transparent data-placeholder:text-slate-500">
                  <SelectValue placeholder="Pilih Filter" />
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false} className="bg-popover border-border text-foreground rounded-lg p-1.5 shadow-md z-100 min-w-[200px]">
                  <SelectItem value="ALL" className="rounded-md py-2.5 focus:bg-accent focus:text-accent-foreground transition-colors">Semua Pembayaran</SelectItem>
                  <SelectItem value="CASH" className="rounded-md py-2.5 focus:bg-accent focus:text-accent-foreground transition-colors">Cash / Tunai</SelectItem>
                  <SelectItem value="BANK" className="rounded-md py-2.5 focus:bg-accent focus:text-accent-foreground transition-colors">Transfer Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="lg:col-span-3 relative group h-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Cari UMKM..."
              className="w-full h-full pl-11 pr-4 bg-background border-border rounded-lg focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <Button
              onClick={onValidateAllClick}
              disabled={filteredAndSortedData.filter(i => !i.isValidated).length === 0}
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> <span className="truncate hidden md:inline">Validasi</span>
            </Button>
            
            <Button
              onClick={onExportExcelClick}
              disabled={filteredAndSortedData.length === 0}
              variant="outline"
              className="flex-1"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" /> <span className="truncate">Export</span>
            </Button>

            <Button
              onClick={onPrintClick}
              disabled={filteredAndSortedData.length === 0}
              variant="outline"
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" /> <span className="truncate">Cetak</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
