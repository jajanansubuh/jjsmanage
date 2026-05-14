import { History, Search } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DeductionTabProps {
  filteredDeductions: any[];
  deductionSearch: string;
  setDeductionSearch: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onSelectDeduction: (d: any) => void;
}

export function DeductionTab({
  filteredDeductions,
  deductionSearch,
  setDeductionSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSelectDeduction
}: DeductionTabProps) {
  return (
    <Card className="border border-white/5 border-t-4 border-t-rose-500 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl shadow-rose-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-rose-400" /> Riwayat Potongan
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-1">Arsip rincian biaya layanan dan iuran mitra.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5 h-12">
            <div className="flex items-center gap-2 px-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Filter:</span>
              <Popover>
                <PopoverTrigger className="text-xs font-bold text-white">
                  {startDate ? format(new Date(startDate), "dd/MM/yy") : "Mulai"} - {endDate ? format(new Date(endDate), "dd/MM/yy") : "Akhir"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="end">
                  <div className="p-4 flex gap-4">
                    <Calendar mode="single" selected={startDate ? new Date(startDate) : undefined} onSelect={(d) => d && setStartDate(format(d, "yyyy-MM-dd"))} className="text-white" />
                    <Calendar mode="single" selected={endDate ? new Date(endDate) : undefined} onSelect={(d) => d && setEndDate(format(d, "yyyy-MM-dd"))} className="text-white" />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            <Input placeholder="Cari suplier/nota..." className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-rose-500/20 text-white" value={deductionSearch} onChange={(e) => setDeductionSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5">
              <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Tanggal</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No. Nota</TableHead>
              <TableHead className="py-5 text-right font-black text-[10px] uppercase tracking-widest text-rose-400">S.Charge</TableHead>
              <TableHead className="py-5 text-right font-black text-[10px] uppercase tracking-widest text-orange-400">Kukuluban</TableHead>
              <TableHead className="py-5 text-right font-black text-[10px] uppercase tracking-widest text-purple-400">Tabungan</TableHead>
              <TableHead className="py-5 text-right px-8 font-black text-[10px] uppercase tracking-widest text-white">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeductions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500 italic">Tidak ada riwayat potongan dalam periode ini.</TableCell></TableRow>
            ) : (
              filteredDeductions.map((d) => {
                const totalDeduction = (d.serviceCharge || 0) + (d.kukuluban || 0) + (d.tabungan || 0);
                return (
                  <TableRow
                    key={d.id}
                    className="border-white/5 hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => onSelectDeduction(d)}
                  >
                    <TableCell className="py-5 px-8 font-bold text-white whitespace-nowrap">
                      {format(new Date(d.deductionDate || d.date || d.createdAt), "dd MMM yy")}
                    </TableCell>
                    <TableCell className="font-black text-blue-400">
                      {d.deductionNoteNumber || (d.deductionDate ? `POT-${format(new Date(d.deductionDate), "ddMMyy")}` : d.noteNumber || "-")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-400">{new Intl.NumberFormat("id-ID").format(d.serviceCharge || 0)}</TableCell>
                    <TableCell className="text-right font-bold text-orange-400">{new Intl.NumberFormat("id-ID").format(d.kukuluban || 0)}</TableCell>
                    <TableCell className="text-right font-bold text-purple-400">{new Intl.NumberFormat("id-ID").format(d.tabungan || 0)}</TableCell>
                    <TableCell className="text-right px-8 font-black text-white">{new Intl.NumberFormat("id-ID").format(totalDeduction)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
