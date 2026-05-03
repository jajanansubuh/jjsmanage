"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download, Calendar as CalendarIcon, Printer, Pencil, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReportsPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [noteDetails, setNoteDetails] = useState<any[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteNoteNumber, setDeleteNoteNumber] = useState<string | null>(null);
  const [deleteCredentials, setDeleteCredentials] = useState({ username: "", password: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setIsMounted(true);
    fetch("/api/reports")
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      });
  }, []);

  // Group reports by noteNumber
  const groupedReports = useMemo(() => {
    const groups: Record<string, any> = {};
    
    reports.forEach(report => {
      const key = report.noteNumber || `TANPA-NOTA-${report.id}`;
      if (!groups[key]) {
        groups[key] = {
          id: report.id,
          noteNumber: report.noteNumber,
          date: report.date || report.createdAt,
          createdAt: report.createdAt,
          revenue: 0,
          profit80: 0,
          profit20: 0,
          itemCount: 0,
          suppliers: [] as string[],
        };
      }
      groups[key].revenue += report.revenue;
      groups[key].profit80 += report.profit80;
      groups[key].profit20 += report.profit20;
      groups[key].itemCount += 1;
      if (report.supplier?.name && !groups[key].suppliers.includes(report.supplier.name)) {
        groups[key].suppliers.push(report.supplier.name);
      }
    });

    return Object.values(groups).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reports]);

  const filteredReports = groupedReports.filter(r => {
    const matchSearch = 
      (r.noteNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.suppliers.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())));
    
    let matchDate = true;
    if (startDate || endDate) {
      const reportDate = new Date(r.createdAt as string);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (reportDate < start) matchDate = false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (reportDate > end) matchDate = false;
      }
    }
    
    return matchSearch && matchDate;
  });

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      toast.error("Tidak ada data laporan untuk diexport");
      return;
    }

    const exportData = filteredReports.map((r, i) => ({
      No: i + 1,
      Tanggal: format(new Date(r.createdAt), "dd/MM/yyyy"),
      "No Nota": r.noteNumber || "-",
      "Jumlah Item": r.itemCount,
      Suplier: r.suppliers.join(", "),
      Pendapatan: r.revenue,
      "Mitra Jjs": r.profit80,
      "Toko": r.profit20
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Per Nota");

    XLSX.writeFile(workbook, `Laporan_Nota_${format(new Date(), "yyyyMMdd")}.xlsx`);
    toast.success("Berhasil export ke Excel");
  };

  const handleDelete = async () => {
    if (!deleteNoteNumber || !deleteCredentials.username || !deleteCredentials.password) {
      setDeleteError("Harap isi username dan password");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/reports/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteNumber: deleteNoteNumber,
          username: deleteCredentials.username,
          password: deleteCredentials.password
        })
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Transaksi berhasil dihapus");
        setIsDeleteModalOpen(false);
        setDeleteCredentials({ username: "", password: "" });
        // Refresh data
        const refreshRes = await fetch("/api/reports");
        const newData = await refreshRes.json();
        setReports(newData);
      } else {
        setDeleteError(result.error || "Gagal menghapus");
      }
    } catch (err) {
      setDeleteError("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalRevenue = filteredReports.reduce((sum, r) => sum + r.revenue, 0);
  const totalProfit80 = filteredReports.reduce((sum, r) => sum + r.profit80, 0);
  const totalProfit20 = filteredReports.reduce((sum, r) => sum + r.profit20, 0);

  if (!isMounted) return null;
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Laporan <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Per Nota</span>
          </h2>
          <p className="text-slate-400 font-medium">Rekapitulasi transaksi yang dikelompokkan berdasarkan nomor nota.</p>
        </div>
        <Button onClick={handleExportExcel} className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
          <Download className="w-5 h-5 mr-2 text-blue-400" /> Export Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group transition-all hover:bg-slate-900/60">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors" />
          <div className="relative space-y-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Total Nota</span>
            <div className="text-4xl font-black text-white">{filteredReports.length}</div>
            <div className="text-xs font-bold text-blue-400/80">Dari seluruh transaksi terpilih</div>
          </div>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group transition-all hover:bg-slate-900/60">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative space-y-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Total Mitra Jjs</span>
            <div className="text-4xl font-black text-emerald-400">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalProfit80)}</div>
            <div className="text-xs font-bold text-emerald-400/80">Total pendapatan Mitra Jjs</div>
          </div>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group transition-all hover:bg-slate-900/60">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors" />
          <div className="relative space-y-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Total Toko</span>
            <div className="text-4xl font-black text-blue-400">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalProfit20)}</div>
            <div className="text-xs font-bold text-blue-400/80">Total pendapatan Toko</div>
          </div>
        </Card>
      </div>

      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-8 px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-white">Daftar Nota Transaksi</CardTitle>
              <CardDescription className="text-slate-400 font-medium mt-1">Menampilkan rekapitulasi per nomor nota.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 p-1 bg-slate-950/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors">Dari</span>
                    <Popover>
                      <PopoverTrigger 
                        className={cn(
                          "flex items-center justify-start text-left bg-transparent border-0 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto min-w-[90px]",
                          !startDate && "text-slate-500"
                        )}
                      >
                        {startDate ? format(new Date(startDate), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl rounded-2xl" align="end">
                        <Calendar
                          mode="single"
                          selected={startDate ? new Date(startDate) : undefined}
                          onSelect={(date) => date && setStartDate(format(date, "yyyy-MM-dd"))}
                          initialFocus
                          className="text-white p-3"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10 mx-1" />
                <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-400 transition-colors">Hingga</span>
                    <Popover>
                      <PopoverTrigger 
                        className={cn(
                          "flex items-center justify-start text-left bg-transparent border-0 text-sm font-bold text-white focus:outline-none cursor-pointer p-0 h-auto min-w-[90px]",
                          !endDate && "text-slate-500"
                        )}
                      >
                        {endDate ? format(new Date(endDate), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl rounded-2xl" align="end">
                        <Calendar
                          mode="single"
                          selected={endDate ? new Date(endDate) : undefined}
                          onSelect={(date) => date && setEndDate(format(date, "yyyy-MM-dd"))}
                          initialFocus
                          className="text-white p-3"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  placeholder="Cari nota atau suplier..." 
                  className="pl-11 pr-4 h-12 w-64 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-5 px-8">Tanggal</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">No Nota</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Total Pendapatan</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Total Mitra Jjs</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Total Toko</TableHead>
                  <TableHead className="text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><div className="flex flex-col items-center gap-3 text-slate-500"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span>Memuat data laporan...</span></div></TableCell></TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500 font-medium italic">Tidak ada laporan yang ditemukan.</TableCell></TableRow>
                ) : (
                  filteredReports.map((r) => (
                    <TableRow 
                      key={r.id} 
                      className="border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => {
                        if (r.noteNumber) {
                          setSelectedNote(r.noteNumber);
                          setIsNoteModalOpen(true);
                          const details = reports.filter(item => item.noteNumber === r.noteNumber);
                          setNoteDetails(details);
                        } else {
                          toast.error("Laporan ini tidak memiliki nomor nota");
                        }
                      }}
                    >
                      <TableCell className="py-5 px-8">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-950 border border-white/5 text-slate-500 group-hover:text-blue-400 transition-colors">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {isMounted ? format(new Date(r.createdAt), "dd MMM yyyy", { locale: id }) : "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-blue-400 tracking-wider">
                        {r.noteNumber || "-"}
                      </TableCell>
                      <TableCell className="font-bold text-white">{isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(r.revenue) : "Rp 0"}</TableCell>
                      <TableCell className="text-emerald-400 font-black">
                        {isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(r.profit80) : "Rp 0"}
                      </TableCell>
                      <TableCell className="text-blue-400 font-black">
                        {isMounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(r.profit20) : "Rp 0"}
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.noteNumber) {
                              setDeleteNoteNumber(r.noteNumber);
                              setIsDeleteModalOpen(true);
                            } else {
                              toast.error("Nota ini tidak valid untuk dihapus");
                            }
                          }}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Nota Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl w-[95vw] sm:max-w-[1200px] sm:ml-32 max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="p-8 border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                Detail Nota: {selectedNote}
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">Semua transaksi yang tergabung dalam nota ini.</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 pt-0">
            {noteLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Memuat detail nota...</span>
              </div>
            ) : (
              <div className="space-y-4 pt-6">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Suplier</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Pendapatan</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Cost</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Barcode</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Potongan</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 text-emerald-400">Mitra Jjs</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 text-blue-400">Toko</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {noteDetails.map((d) => {
                      const totalDeductions = (d.serviceCharge || 0) + (d.kukuluban || 0) + (d.tabungan || 0);
                      return (
                        <TableRow key={d.id} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="font-bold text-slate-200">{d.supplier?.name}</TableCell>
                          <TableCell className="text-right text-slate-300">{new Intl.NumberFormat("id-ID").format(d.revenue)}</TableCell>
                          <TableCell className="text-right text-slate-400">{new Intl.NumberFormat("id-ID").format(d.cost)}</TableCell>
                          <TableCell className="text-right text-slate-400">{new Intl.NumberFormat("id-ID").format(d.barcode)}</TableCell>
                          <TableCell className="text-right text-red-400/70 text-xs">-{new Intl.NumberFormat("id-ID").format(totalDeductions)}</TableCell>
                          <TableCell className="text-right font-black text-emerald-400">{new Intl.NumberFormat("id-ID").format(d.profit80)}</TableCell>
                          <TableCell className="text-right font-black text-blue-400">{new Intl.NumberFormat("id-ID").format(d.profit20)}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-t-2 border-white/10 bg-white/[0.03] font-black">
                      <TableCell className="text-white">TOTAL</TableCell>
                      <TableCell className="text-right text-white">
                        {new Intl.NumberFormat("id-ID").format(noteDetails.reduce((sum, d) => sum + d.revenue, 0))}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                      <TableCell className="text-right text-emerald-400">
                        {new Intl.NumberFormat("id-ID").format(noteDetails.reduce((sum, d) => sum + d.profit80, 0))}
                      </TableCell>
                      <TableCell className="text-right text-blue-400">
                        {new Intl.NumberFormat("id-ID").format(noteDetails.reduce((sum, d) => sum + d.profit20, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-between gap-3">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (!selectedNote || noteDetails.length === 0) return;
                  const editData = {
                    noteNumber: selectedNote,
                    date: noteDetails[0]?.date || noteDetails[0]?.createdAt,
                    rows: noteDetails.map((d: any) => ({
                      id: d.id,
                      supplierId: d.supplierId,
                      revenue: d.revenue,
                      barcode: d.barcode,
                      cost: d.cost,
                      serviceCharge: d.serviceCharge || 0,
                      kukuluban: d.kukuluban || 0,
                      tabungan: d.tabungan || 0,
                      profit80: d.profit80,
                      profit20: d.profit20,
                    })),
                  };
                  localStorage.setItem("jjs-edit-transaction", JSON.stringify(editData));
                  setIsNoteModalOpen(false);
                  router.push(`/transactions?edit=${selectedNote}`);
                }}
                className="h-11 px-6 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Pencil className="w-4 h-4 mr-2" /> Edit Transaksi
              </Button>
              <Button
                onClick={() => {
                  if (!selectedNote || noteDetails.length === 0) return;
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) {
                    toast.error('Popup diblokir. Izinkan popup untuk mencetak.');
                    return;
                  }

                  const noteDate = noteDetails[0]?.date || noteDetails[0]?.createdAt;
                  const formattedDate = noteDate ? format(new Date(noteDate), "dd MMMM yyyy", { locale: id }) : '-';
                  
                  // Sort alphabetically A-Z
                  const sortedDetails = [...noteDetails].sort((a, b) => {
                    const nameA = a.supplier?.name || "";
                    const nameB = b.supplier?.name || "";
                    return nameA.localeCompare(nameB);
                  });

                  const totalRevenue = noteDetails.reduce((sum, d) => sum + (d.revenue || 0), 0);
                  const totalCost = noteDetails.reduce((sum, d) => sum + (d.cost || 0), 0);
                  const totalBarcode = noteDetails.reduce((sum, d) => sum + (d.barcode || 0), 0);
                  const totalServiceCharge = noteDetails.reduce((sum, d) => sum + (d.serviceCharge || 0), 0);
                  const totalKukuluban = noteDetails.reduce((sum, d) => sum + (d.kukuluban || 0), 0);
                  const totalTabungan = noteDetails.reduce((sum, d) => sum + (d.tabungan || 0), 0);
                  const totalProfit80 = noteDetails.reduce((sum, d) => sum + (d.profit80 || 0), 0);
                  const totalProfit20 = noteDetails.reduce((sum, d) => sum + (d.profit20 || 0), 0);

                  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
                  
                  const tableRows = sortedDetails.map((d, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${d.supplier?.name || '-'}</td>
                      <td align="right">${fmt(d.revenue)}</td>
                      <td align="right">${fmt(d.cost)}</td>
                      <td align="right">${fmt(d.barcode)}</td>
                      <td align="right">${fmt(d.serviceCharge || 0)}</td>
                      <td align="right">${fmt(d.kukuluban || 0)}</td>
                      <td align="right">${fmt(d.tabungan || 0)}</td>
                      <td align="right">${fmt(d.profit80)}</td>
                      <td align="right">${fmt(d.profit20)}</td>
                    </tr>
                  `).join('');

                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Nota Transaksi - ${selectedNote}</title>
                        <style>
                          @page { size: portrait; margin: 0; }
                          body { font-family: sans-serif; color: #333; line-height: 1.4; padding: 15mm; }
                          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                          h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
                          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px; }
                          .meta-item { margin-bottom: 3px; }
                          .meta-label { font-weight: bold; color: #666; display: inline-block; width: 70px; }
                          .notes-box { margin: 15px 0; padding: 10px; border: 1px dashed #ccc; font-style: italic; font-size: 12px; }
                          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
                          th { background: #f0f0f0; padding: 8px 5px; text-align: left; border: 1px solid #ddd; text-transform: uppercase; }
                          td { padding: 6px 5px; border: 1px solid #ddd; }
                          tfoot td { background: #f9f9f9; font-weight: bold; border-top: 2px solid #333; }
                          .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; }
                          .sig { border-top: 1px solid #333; width: 160px; text-align: center; padding-top: 8px; margin-top: 50px; font-size: 11px; font-weight: bold; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>Laporan Bagi Hasil - Jajanan Subuh</h1>
                        </div>
                        
                        <div class="meta-grid">
                          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${selectedNote}</strong></div>
                          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${formattedDate}</div>
                        </div>

                        ${noteDetails[0]?.notes ? `<div class="notes-box"><strong>Catatan:</strong> "${noteDetails[0].notes}"</div>` : ''}

                        <table>
                          <thead>
                            <tr>
                              <th>No</th>
                              <th width="150">Suplier</th>
                              <th align="right">Pendapatan</th>
                              <th align="right">Cost</th>
                              <th align="right">Barcode</th>
                              <th align="right">S.Charge</th>
                              <th align="right">Kukuluban</th>
                              <th align="right">Tabungan</th>
                              <th align="right">Mitra Jjs</th>
                              <th align="right">Toko</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${tableRows}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colspan="2" align="center">TOTAL</td>
                              <td align="right">${fmt(totalRevenue)}</td>
                              <td align="right">${fmt(totalCost)}</td>
                              <td align="right">${fmt(totalBarcode)}</td>
                              <td align="right">${fmt(totalServiceCharge)}</td>
                              <td align="right">${fmt(totalKukuluban)}</td>
                              <td align="right">${fmt(totalTabungan)}</td>
                              <td align="right">${fmt(totalProfit80)}</td>
                              <td align="right">${fmt(totalProfit20)}</td>
                            </tr>
                          </tfoot>
                        </table>

                        <div class="footer-sig">
                          <div class="sig">Kasir / Admin</div>
                          <div class="sig">Manager / Owner</div>
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                  }, 250);
                }}
                className="h-11 px-6 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold border border-blue-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Ulang
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setIsNoteModalOpen(false)} className="h-11 px-8 rounded-xl text-white bg-white/5 hover:bg-white/10 font-bold">Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
        setIsDeleteModalOpen(open);
        if (!open) {
          setDeleteCredentials({ username: "", password: "" });
          setDeleteError("");
        }
      }}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-3xl shadow-2xl max-w-md p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">Konfirmasi Penghapusan</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium pt-2">
                  Anda akan menghapus nota <span className="text-white font-bold">{deleteNoteNumber}</span>. Tindakan ini tidak dapat dibatalkan.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username Admin</label>
                <Input
                  placeholder="Masukkan username"
                  value={deleteCredentials.username}
                  onChange={(e) => setDeleteCredentials({ ...deleteCredentials, username: e.target.value })}
                  className="bg-white/5 border-white/5 h-12 rounded-xl focus:ring-red-500/20 focus:border-red-500/50 transition-all text-white font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
                <Input
                  type="password"
                  placeholder="Masukkan password"
                  value={deleteCredentials.password}
                  onChange={(e) => setDeleteCredentials({ ...deleteCredentials, password: e.target.value })}
                  className="bg-white/5 border-white/5 h-12 rounded-xl focus:ring-red-500/20 focus:border-red-500/50 transition-all text-white font-medium"
                  onKeyDown={(e) => e.key === "Enter" && handleDelete()}
                />
              </div>
              {deleteError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                  {deleteError}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 h-12 rounded-xl text-slate-400 font-bold hover:bg-white/5"
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "HAPUS PERMANEN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
