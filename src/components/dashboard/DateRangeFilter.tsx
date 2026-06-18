import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function DateRangeFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate
}: {
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 p-1.5 bg-card rounded-xl border border-border shadow-sm w-full lg:w-auto">
      <div className="flex items-center gap-1 w-full sm:w-auto">
        <div className="flex items-center gap-3 px-4 py-2 hover:bg-accent/50 rounded-lg transition-colors group flex-1 sm:flex-none">
          <div className="flex flex-col w-full">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Dari</span>
            <Popover>
              <PopoverTrigger
                className={cn(
                  "flex items-center justify-start text-left bg-transparent border-0 text-sm font-bold text-foreground focus:outline-none cursor-pointer p-0 h-auto min-w-[90px] w-full sm:w-auto",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate ? format(new Date(startDate), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border shadow-md rounded-xl" align="end">
                <Calendar
                  mode="single"
                  selected={startDate ? new Date(startDate) : undefined}
                  onSelect={(date: Date | undefined) => date && setStartDate(format(date, "yyyy-MM-dd"))}
                  initialFocus
                  className="text-foreground p-3"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="h-8 w-px bg-border mx-1" />

        <div className="flex items-center gap-3 px-4 py-2 hover:bg-accent/50 rounded-lg transition-colors group flex-1 sm:flex-none">
          <div className="flex flex-col w-full">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Hingga</span>
            <Popover>
              <PopoverTrigger
                className={cn(
                  "flex items-center justify-start text-left bg-transparent border-0 text-sm font-bold text-foreground focus:outline-none cursor-pointer p-0 h-auto min-w-[90px] w-full sm:w-auto",
                  !endDate && "text-muted-foreground"
                )}
              >
                {endDate ? format(new Date(endDate), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border shadow-md rounded-xl" align="end">
                <Calendar
                  mode="single"
                  selected={endDate ? new Date(endDate) : undefined}
                  onSelect={(date: Date | undefined) => date && setEndDate(format(date, "yyyy-MM-dd"))}
                  initialFocus
                  className="text-foreground p-3"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
