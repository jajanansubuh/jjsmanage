import { Search, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface SavingsInputHeaderProps {
  savingsNoteNumber: string;
  savingsDate: string;
  setSavingsDate: (val: string) => void;
  startDate: string;
  endDate: string;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export function SavingsInputHeader({
  savingsNoteNumber,
  savingsDate,
  setSavingsDate,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  searchTerm,
  setSearchTerm,
}: SavingsInputHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="space-y-2">
        <Link 
          href="/transactions" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Input Transaksi
        </Link>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Input Tabungan
        </h2>
        <p className="text-muted-foreground font-medium text-sm md:text-base">
          Penginputan tabungan mitra secara kolektif per suplier untuk rentang waktu terpilih.
        </p>
      </div>

      {/* Control Panel Card */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-5 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
            {/* 1. No. Nota Tabungan */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                No. Nota Tabungan
              </Label>
              <div 
                className="flex items-center px-4 h-12 bg-muted/40 rounded-xl border border-border/80 select-none cursor-default shadow-inner"
                title="Nomor nota otomatis mengikuti tanggal nota tabungan"
              >
                <span className="font-mono text-sm font-black text-blue-400 tracking-wider">
                  {savingsNoteNumber}
                </span>
              </div>
            </div>

            {/* 2. Tgl. Nota Tabungan */}
            <div className="lg:col-span-2 flex flex-col gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Tgl. Nota Tabungan
              </Label>
              <Popover>
                <PopoverTrigger className="flex items-center justify-between px-4 h-12 bg-muted/40 hover:bg-muted/70 rounded-xl border border-border/80 text-sm font-bold text-foreground transition-all cursor-pointer select-none">
                  <span>{format(new Date(savingsDate), "dd/MM/yyyy")}</span>
                  <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border shadow-2xl rounded-2xl" align="start">
                  <Calendar 
                    mode="single" 
                    selected={new Date(savingsDate)} 
                    onSelect={(d) => {
                      if (d) {
                        const formatted = format(d, "yyyy-MM-dd");
                        setSavingsDate(formatted);
                      }
                    }} 
                    initialFocus 
                    className="text-foreground" 
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 3. Periode Transaksi */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Periode Transaksi
              </Label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                className="w-full"
              />
            </div>

            {/* 4. Cari Suplier */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Cari Mitra / Suplier
              </Label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ketik nama suplier..."
                  className="pl-10 pr-4 h-12 bg-muted/40 border-border/80 rounded-xl focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-foreground text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
