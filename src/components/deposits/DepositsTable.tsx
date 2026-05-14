import { format } from "date-fns";
import { ArrowUpDown, CheckCircle2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DepositItem } from "@/app/(dashboard)/deposits/hooks/use-deposits-data";

interface DepositsTableProps {
  filteredAndSortedData: DepositItem[];
  loading: boolean;
  role: string | null;
  sortConfig: { key: keyof DepositItem; direction: "asc" | "desc" } | null;
  onSort: (key: keyof DepositItem) => void;
  onViewDetails: (item: any) => void;
  onValidate: (id: string) => void;
}

export function DepositsTable({
  filteredAndSortedData,
  loading,
  role,
  sortConfig,
  onSort,
  onViewDetails,
  onValidate
}: DepositsTableProps) {

  const getSortIcon = (key: keyof DepositItem) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />;
    return sortConfig.direction === "asc" ? <ArrowUpDown className="w-3 h-3 text-emerald-400" /> : <ArrowUpDown className="w-3 h-3 text-emerald-400 rotate-180" />;
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
             <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
             <p className="text-slate-500 font-medium">Memuat data...</p>
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5">
            <p className="text-slate-500 font-medium italic">Tidak ada transaksi pada tanggal ini.</p>
          </div>
        ) : (
          filteredAndSortedData.map((item) => (
            <Card key={item.id} className="bg-slate-900/40 border-white/5 rounded-2xl overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {role === "SUPPLIER" ? "Keterangan" : "Nama UMKM"}
                    </span>
                    <h4 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors uppercase truncate max-w-[200px]">
                      {item.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                      {role === "SUPPLIER" ? "Pendapatan" : "Total Setor"}
                    </span>
                    <span className="text-lg font-black text-emerald-400">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.dailyProfit)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {role === "SUPPLIER" ? "Tanggal" : "Pemilik"}
                    </span>
                    <p className="text-sm font-bold text-slate-300">
                      {item.ownerName || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {role === "SUPPLIER" ? "Waktu" : "Metode"}
                    </span>
                    <p className="text-sm font-bold text-slate-300">
                      {role === "SUPPLIER" ? "TERVALIDASI" : (item.bankName || "CASH")}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {role === "SUPPLIER" ? "Nomor Nota" : "No Rekening"}
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-400">
                      {item.accountNumber || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-white/5 flex gap-2">
                  {role === "SUPPLIER" ? (
                    <Button
                      onClick={() => onViewDetails(item)}
                      className="w-full h-11 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-white font-bold border border-white/10 gap-2 transition-all"
                    >
                      <Eye className="w-4 h-4" /> Lihat Detail
                    </Button>
                  ) : (
                    <>
                       {!item.isValidated ? (
                         <Button
                          onClick={() => onValidate(item.id)}
                          className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Validasi
                        </Button>
                       ) : (
                        <div className="flex-1 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-4 h-4" /> Tervalidasi
                        </div>
                       )}
                       <Button
                        variant="ghost"
                        onClick={() => onViewDetails(item)}
                        className="h-11 w-11 p-0 rounded-xl bg-white/5 border border-white/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-6 px-8 cursor-pointer group" onClick={() => onSort("name")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Keterangan / Nota" : "Nama UMKM"} {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => onSort("ownerName")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Tanggal" : "Pemilik"} {getSortIcon("ownerName")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => onSort("bankName")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Waktu" : "Bank"} {getSortIcon("bankName")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 cursor-pointer group" onClick={() => onSort("accountNumber")}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Nomor Nota" : "No Rekening"} {getSortIcon("accountNumber")}
                    </div>
                  </TableHead>
                  <TableHead className="py-6 px-8 text-right cursor-pointer group" onClick={() => onSort("dailyProfit")}>
                    <div className="flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                      {role === "SUPPLIER" ? "Pendapatan" : "Total Setor"} {getSortIcon("dailyProfit")}
                    </div>
                  </TableHead>
                  {role === "SUPPLIER" ? (
                    <TableHead className="py-6 px-8 text-center">
                      <div className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Aksi
                      </div>
                    </TableHead>
                  ) : (
                    <TableHead className="py-6 px-8 text-center">
                      <div className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Validasi
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24">
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">Memuat data transaksi...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-slate-500 font-medium italic">
                      Tidak ada transaksi pada tanggal ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedData.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.03] transition-all duration-500 group relative">
                      <TableCell className="py-6 px-8 relative overflow-hidden">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-emerald-500 group-hover:h-1/2 transition-all duration-500 rounded-r-full" />
                        <span className="font-black text-lg text-white tracking-tight group-hover:text-emerald-400 transition-all duration-300 uppercase">
                          {item.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                          {item.ownerName || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-8">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            role === "SUPPLIER" ? "bg-emerald-400" : "bg-blue-400"
                          )} />
                          <span className="font-black text-slate-300 tracking-wider uppercase group-hover:text-white transition-colors">
                            {role === "SUPPLIER" ? "TERVALIDASI" : (item.bankName || "CASH")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                          {item.accountNumber || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <span className="font-black text-xl tracking-tighter text-emerald-400 transition-all duration-500 group-hover:scale-110 inline-block origin-right group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0
                          }).format(item.dailyProfit)}
                        </span>
                      </TableCell>
                      {role === "SUPPLIER" ? (
                        <TableCell className="text-center px-8">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(item)}
                            className="h-9 w-9 p-0 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 transition-all border border-white/5"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      ) : (
                        <TableCell className="text-center px-8">
                          {item.isValidated ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                Tervalidasi
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewDetails(item)}
                                className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onValidate(item.id)}
                                className="h-8 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-bold text-xs"
                              >
                                Validasi
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewDetails(item)}
                                className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
