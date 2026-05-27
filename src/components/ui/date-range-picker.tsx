"use client";

import * as React from "react";
import { format, startOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  // String-based range (for Reports Tabs)
  startDate?: string;
  endDate?: string;
  onChange?: (start: string, end: string) => void;

  // Object-based range (for Deposits Filters)
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;

  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  dateRange,
  onDateRangeChange,
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"from" | "to">("from");
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile viewport size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize local states
  const [localStart, setLocalStart] = React.useState<Date | undefined>(undefined);
  const [localEnd, setLocalEnd] = React.useState<Date | undefined>(undefined);

  // Sync with parent props when opened or when parents update
  React.useEffect(() => {
    if (dateRange) {
      setLocalStart(dateRange.from);
      setLocalEnd(dateRange.to);
    } else {
      setLocalStart(startDate ? new Date(startDate) : undefined);
      setLocalEnd(endDate ? new Date(endDate) : undefined);
    }
  }, [isOpen, startDate, endDate, dateRange]);

  const handleApply = () => {
    if (onDateRangeChange) {
      onDateRangeChange({ from: localStart, to: localEnd });
    } else if (onChange) {
      const startStr = localStart ? format(localStart, "yyyy-MM-dd") : "";
      const endStr = localEnd ? format(localEnd, "yyyy-MM-dd") : "";
      onChange(startStr, endStr);
    }
    setIsOpen(false);
  };

  // Helper to format date for display
  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "Pilih Tanggal";
    return format(date, "dd MMM yyyy", { locale: localeId });
  };

  // Short format for mobile trigger
  const formatDateShort = (date: Date | undefined) => {
    if (!date) return "Pilih";
    return format(date, "dd/MM/yy");
  };

  const applyPreset = (getRange: () => { from: Date; to: Date }) => {
    const range = getRange();
    setLocalStart(range.from);
    setLocalEnd(range.to);
  };

  const displayStart = localStart || dateRange?.from || (startDate ? new Date(startDate) : undefined);
  const displayEnd = localEnd || dateRange?.to || (endDate ? new Date(endDate) : undefined);

  const pickerContent = (
    <div className="flex flex-col sm:flex-row">
      {/* Preset Shortcuts */}
      <div className="flex sm:flex-col gap-1 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-white/10 overflow-x-auto sm:overflow-x-visible shrink-0 bg-slate-950/20">
        <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 px-3">
          PILIH CEPAT
        </span>
        {[
          { label: "Hari Ini", getRange: () => ({ from: startOfDay(new Date()), to: new Date() }) },
          { label: "7 Hari", getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
          { label: "Bulan Ini", getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
          { label: "Bulan Lalu", getRange: () => { const prev = subMonths(new Date(), 1); return { from: startOfMonth(prev), to: endOfMonth(prev) }; } },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.getRange)}
            className="whitespace-nowrap text-left text-[11px] sm:text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 px-3 py-2 sm:py-2.5 rounded-xl transition-all"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Calendar Picker Panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile: Tab switcher between Dari/Hingga */}
        <div className="flex sm:hidden border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("from")}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider text-center transition-all",
              activeTab === "from"
                ? "text-blue-400 border-b-2 border-blue-400 bg-blue-400/5"
                : "text-slate-500"
            )}
          >
            DARI {localStart ? format(localStart, "dd/MM", { locale: localeId }) : ""}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("to")}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider text-center transition-all",
              activeTab === "to"
                ? "text-blue-400 border-b-2 border-blue-400 bg-blue-400/5"
                : "text-slate-500"
            )}
          >
            HINGGA {localEnd ? format(localEnd, "dd/MM", { locale: localeId }) : ""}
          </button>
        </div>

        {/* Mobile: Single calendar with tab switching */}
        <div className="sm:hidden p-1 flex justify-center bg-slate-950/10">
          {activeTab === "from" ? (
            <Calendar
              mode="single"
              selected={localStart}
              onSelect={(d) => {
                setLocalStart(d);
                // Auto-switch to "to" tab after selecting start
                setTimeout(() => setActiveTab("to"), 200);
              }}
              className="text-white"
            />
          ) : (
            <Calendar
              mode="single"
              selected={localEnd}
              onSelect={setLocalEnd}
              className="text-white"
            />
          )}
        </div>

        {/* Desktop: Side-by-side calendars */}
        <div className="hidden sm:flex gap-2 p-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-400 tracking-wider mb-1 px-3">TANGGAL MULAI</span>
            <Calendar
              mode="single"
              selected={localStart}
              onSelect={setLocalStart}
              className="text-white bg-slate-950/30 rounded-2xl border border-white/5"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 tracking-wider mb-1 px-3">TANGGAL AKHIR</span>
            <Calendar
              mode="single"
              selected={localEnd}
              onSelect={setLocalEnd}
              className="text-white bg-slate-950/30 rounded-2xl border border-white/5"
            />
          </div>
        </div>

        {/* Confirmation Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 flex justify-end bg-slate-950/40 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white hover:bg-white/5 font-bold px-4 rounded-xl"
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-600/20"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center bg-slate-950/40 border border-white/5 hover:bg-white/5 transition-all text-left h-14 rounded-2xl overflow-hidden cursor-pointer shrink-0 select-none group w-full",
            className
          )}
        >
          {/* Dari Field */}
          <div className="flex-1 py-1 px-3 sm:px-4 flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest leading-none mb-1 group-hover:text-blue-300 transition-colors">
              DARI
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-300 truncate group-hover:text-white transition-colors">
              <span className="hidden sm:inline">{formatDateDisplay(displayStart)}</span>
              <span className="sm:hidden">{formatDateShort(displayStart)}</span>
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-8 w-[1px] bg-white/10 shrink-0 self-center" />

          {/* Hingga Field */}
          <div className="flex-1 py-1 px-3 sm:px-4 flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1 group-hover:text-slate-400 transition-colors">
              HINGGA
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-300 truncate group-hover:text-white transition-colors">
              <span className="hidden sm:inline">{formatDateDisplay(displayEnd)}</span>
              <span className="sm:hidden">{formatDateShort(displayEnd)}</span>
            </span>
          </div>
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent 
            showCloseButton={false}
            className="p-0 bg-slate-900 border-white/10 shadow-2xl rounded-2xl overflow-hidden w-[calc(100vw-2rem)] max-w-sm border-0 ring-0 focus:ring-0 outline-none"
          >
            {pickerContent}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(
          "flex items-center bg-slate-950/40 border border-white/5 hover:bg-white/5 transition-all text-left h-14 rounded-2xl overflow-hidden cursor-pointer shrink-0 select-none group w-full",
          className
        )}
      >
        {/* Dari Field */}
        <div className="flex-1 py-1 px-3 sm:px-4 flex flex-col justify-center min-w-0">
          <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest leading-none mb-1 group-hover:text-blue-300 transition-colors">
            DARI
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-300 truncate group-hover:text-white transition-colors">
            <span className="hidden sm:inline">{formatDateDisplay(displayStart)}</span>
            <span className="sm:hidden">{formatDateShort(displayStart)}</span>
          </span>
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-[1px] bg-white/10 shrink-0 self-center" />

        {/* Hingga Field */}
        <div className="flex-1 py-1 px-3 sm:px-4 flex flex-col justify-center min-w-0">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1 group-hover:text-slate-400 transition-colors">
            HINGGA
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-300 truncate group-hover:text-white transition-colors">
            <span className="hidden sm:inline">{formatDateDisplay(displayEnd)}</span>
            <span className="sm:hidden">{formatDateShort(displayEnd)}</span>
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl rounded-[2rem] overflow-hidden" align="start">
        {pickerContent}
      </PopoverContent>
    </Popover>
  );
}

