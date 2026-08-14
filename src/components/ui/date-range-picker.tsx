"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  // String-based range (for Reports Tabs)
  startDate?: string;
  endDate?: string;
  onChange?: (start: string, end: string) => void;

  // Object-based range (for Deposits / Potongan Filters)
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
  const [isStartOpen, setIsStartOpen] = React.useState(false);
  const [isEndOpen, setIsEndOpen] = React.useState(false);

  const fromDate = dateRange?.from || (startDate ? new Date(startDate) : undefined);
  const toDate = dateRange?.to || (endDate ? new Date(endDate) : undefined);

  const handleSelectFrom = (date: Date | undefined) => {
    const newFrom = date;
    const newTo = toDate;
    if (onDateRangeChange) {
      onDateRangeChange({ from: newFrom, to: newTo });
    }
    if (onChange) {
      const startStr = newFrom ? format(newFrom, "yyyy-MM-dd") : "";
      const endStr = newTo ? format(newTo, "yyyy-MM-dd") : "";
      onChange(startStr, endStr);
    }
    setIsStartOpen(false);
  };

  const handleSelectTo = (date: Date | undefined) => {
    const newFrom = fromDate;
    const newTo = date;
    if (onDateRangeChange) {
      onDateRangeChange({ from: newFrom, to: newTo });
    }
    if (onChange) {
      const startStr = newFrom ? format(newFrom, "yyyy-MM-dd") : "";
      const endStr = newTo ? format(newTo, "yyyy-MM-dd") : "";
      onChange(startStr, endStr);
    }
    setIsEndOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* DARI (Start Date) */}
      <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
        <PopoverTrigger className="flex flex-col justify-center px-3.5 py-1.5 h-12 bg-card/40 border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all duration-300 text-left min-w-[130px] group cursor-pointer select-none outline-none">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1 group-hover:text-emerald-400 transition-colors">
            DARI
          </span>
          <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
            {fromDate ? format(fromDate, "dd MMM yyyy", { locale: localeId }) : "Pilih Tanggal"}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 bg-zinc-950 border border-white/10 shadow-2xl rounded-2xl" align="start">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-2">
            <span className="text-xs font-bold text-white">Tanggal Mulai</span>
            {fromDate && (
              <button
                type="button"
                onClick={() => handleSelectFrom(undefined)}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Hapus
              </button>
            )}
          </div>
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={handleSelectFrom}
            className="text-foreground"
          />
        </PopoverContent>
      </Popover>

      <span className="text-slate-600 font-bold text-sm">-</span>

      {/* HINGGA (End Date) */}
      <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
        <PopoverTrigger className="flex flex-col justify-center px-3.5 py-1.5 h-12 bg-card/40 border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all duration-300 text-left min-w-[130px] group cursor-pointer select-none outline-none">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1 group-hover:text-emerald-400 transition-colors">
            HINGGA
          </span>
          <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
            {toDate ? format(toDate, "dd MMM yyyy", { locale: localeId }) : "Pilih Tanggal"}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 bg-zinc-950 border border-white/10 shadow-2xl rounded-2xl" align="end">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-2">
            <span className="text-xs font-bold text-white">Tanggal Akhir</span>
            {toDate && (
              <button
                type="button"
                onClick={() => handleSelectTo(undefined)}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Hapus
              </button>
            )}
          </div>
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={handleSelectTo}
            className="text-foreground"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
