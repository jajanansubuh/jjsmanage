import { FileText, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface TransactionTabProps {
  loading: boolean;
  userRole: string | null;
  filteredReports: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onSelectNote: (noteNumber: string) => void;
  onDeleteNote: (noteNumber: string) => void;
}

export function TransactionTab({
  loading,
  userRole,
  filteredReports,
  searchTerm,
  setSearchTerm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSelectNote,
  onDeleteNote
}: TransactionTabProps) {
  return (
    <Card className="border border-white/5 border-t-4 border-t-blue-500 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" /> Riwayat Transaksi
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-1">Dikelompokkan berdasarkan nomor nota.</CardDescription>
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <Input placeholder={userRole === "SUPPLIER" ? "Cari nota..." : "Cari nota/catatan..."} className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20 text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5">
              <TableHead className="py-5 px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Tanggal</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">No Nota</TableHead>
              {userRole !== "SUPPLIER" && <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Catatan</TableHead>}
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Mitra Jjs</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Toko</TableHead>
              <TableHead className="py-5 text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="text-center py-20 text-slate-500">Memuat...</TableCell></TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow><TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="text-center py-20 text-slate-500 italic">Tidak ada data.</TableCell></TableRow>
            ) : (
              filteredReports.map((r) => (
                <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => onSelectNote(r.noteNumber)}>
                  <TableCell className="py-5 px-8 font-bold text-white">{format(new Date(r.date), "dd MMM yyyy", { locale: id })}</TableCell>
                  <TableCell className="font-black text-blue-400">{r.noteNumber || "-"}</TableCell>
                  {userRole !== "SUPPLIER" && <TableCell className="text-slate-400 font-medium max-w-[200px] truncate">{r.notes}</TableCell>}
                  <TableCell className="text-emerald-400 font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.profit80)}</TableCell>
                  <TableCell className="text-blue-400 font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.profit20)}</TableCell>
                  <TableCell className="text-right px-8">
                    <Button variant="ghost" size="icon" className="hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDeleteNote(r.noteNumber); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
