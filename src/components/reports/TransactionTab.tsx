import { useState, useEffect } from "react";
import { FileText, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            className="h-12 bg-slate-950/50 border-white/5 rounded-2xl"
          />

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
            ) : paginatedReports.length === 0 ? (
              <TableRow><TableCell colSpan={userRole === "SUPPLIER" ? 5 : 6} className="text-center py-20 text-slate-500 italic">Tidak ada data.</TableCell></TableRow>
            ) : (
              paginatedReports.map((r) => (
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-slate-400 font-medium">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-10 w-10 border border-white/10 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
