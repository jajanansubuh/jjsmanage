"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Scissors,
  Calendar as CalendarIcon,
  Save,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateAggregatedDeductionsAction } from "@/lib/actions/deductions";

interface DeductionRow {
  supplierId: string;
  supplierName: string;
  noteNumbers: string[];
  totalCost: number;
  totalBarcode: number;
  serviceCharge: number;
  kukuluban: number;
  tabungan: number;
  baseProfit80: number; // Sum of (cost - barcode)
}

export default function PotonganPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editNote = searchParams.get("edit");

  const [deductionDate, setDeductionDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [deductionNoteNumber, setDeductionNoteNumber] = useState(
    `POT-${format(new Date(), "ddMMyy")}001`,
  );
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rows, setRows] = useState<DeductionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] = useState(false);
  const [savedNoteInfo, setSavedNoteInfo] = useState<{
    noteNumber: string;
    date: string;
    startDate: string;
    endDate: string;
    totals: {
      serviceCharge: number;
      kukuluban: number;
      tabungan: number;
      grandTotal: number;
    };
    details: DeductionRow[];
  } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedDeductionDate = localStorage.getItem(
      "jjs-potongan-deductionDate",
    );
    const savedNoteNumber = localStorage.getItem("jjs-potongan-noteNumber");
    const savedStartDate = localStorage.getItem("jjs-potongan-startDate");
    const savedEndDate = localStorage.getItem("jjs-potongan-endDate");
    const savedRows = localStorage.getItem("jjs-potongan-rows");

    if (savedDeductionDate) setDeductionDate(savedDeductionDate);
    if (savedNoteNumber) setDeductionNoteNumber(savedNoteNumber);
    if (savedStartDate) setStartDate(savedStartDate);
    if (savedEndDate) setEndDate(savedEndDate);
    if (savedRows) setRows(JSON.parse(savedRows));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("jjs-potongan-deductionDate", deductionDate);
      localStorage.setItem("jjs-potongan-noteNumber", deductionNoteNumber);
      localStorage.setItem("jjs-potongan-startDate", startDate);
      localStorage.setItem("jjs-potongan-endDate", endDate);
      localStorage.setItem("jjs-potongan-rows", JSON.stringify(rows));
    }
  }, [deductionDate, deductionNoteNumber, startDate, endDate, rows, isMounted]);

  const fetchReports = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports?startDate=${start}&endDate=${end}&limit=2000`,
      );
      const data = await res.json();
      const reports = Array.isArray(data) ? data : data.reports || [];

      // Aggregate by supplier
      const groups: Record<string, DeductionRow> = {};

      reports.forEach((r: any) => {
        // Skip transactions that have already been processed for deductions
        if (r.deductionNoteNumber) return;

        const sId = r.supplierId;
        if (!groups[sId]) {
          groups[sId] = {
            supplierId: sId,
            supplierName: r.supplier?.name || "Unknown",
            noteNumbers: [],
            totalCost: 0,
            totalBarcode: 0,
            serviceCharge: 0,
            kukuluban: 0,
            tabungan: 0,
            baseProfit80: 0,
          };
        }

        if (r.noteNumber && !groups[sId].noteNumbers.includes(r.noteNumber)) {
          groups[sId].noteNumbers.push(r.noteNumber);
        }

        groups[sId].totalCost += r.cost || 0;
        groups[sId].totalBarcode += r.barcode || 0;
        groups[sId].serviceCharge += r.serviceCharge || 0;
        groups[sId].kukuluban += r.kukuluban || 0;
        groups[sId].tabungan += r.tabungan || 0;
        // Base profit is cost - barcode
        groups[sId].baseProfit80 += (r.cost || 0) - (r.barcode || 0);
      });

      // Convert to array and sort A-Z
      const aggregatedRows = Object.values(groups).sort((a, b) =>
        a.supplierName.localeCompare(b.supplierName),
      );

      // Merge existing inputs from localStorage if any
      const savedRowsStr = localStorage.getItem("jjs-potongan-rows");
      if (savedRowsStr) {
        const savedRows = JSON.parse(savedRowsStr) as DeductionRow[];
        const mergedRows = aggregatedRows.map((row) => {
          const saved = savedRows.find((s) => s.supplierId === row.supplierId);
          if (saved) {
            return {
              ...row,
              serviceCharge: saved.serviceCharge,
              kukuluban: saved.kukuluban,
              tabungan: saved.tabungan,
            };
          }
          return row;
        });
        setRows(mergedRows);
      } else {
        setRows(aggregatedRows);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast.error("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch specifically for editing an existing deduction note
  const fetchDeductionForEdit = useCallback(async (noteNum: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?deductionNoteNumber=${noteNum}&limit=2000`);
      const data = await res.json();
      const reports = Array.isArray(data) ? data : data.reports || [];

      if (reports.length === 0) {
        toast.error("Nota potongan tidak ditemukan");
        router.push("/potongan");
        return;
      }

      // Extract common fields from the first report
      const first = reports[0];
      if (first.deductionDate) setDeductionDate(format(new Date(first.deductionDate), "yyyy-MM-dd"));
      setDeductionNoteNumber(first.deductionNoteNumber || noteNum);
      
      // Reconstruct the period range from the reports
      const dates = reports.map((r: any) => new Date(r.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      
      setStartDate(format(minDate, "yyyy-MM-dd"));
      setEndDate(format(maxDate, "yyyy-MM-dd"));
      
      const groups: Record<string, DeductionRow> = {};
      reports.forEach((r: any) => {
        const sId = r.supplierId;
        if (!groups[sId]) {
          groups[sId] = {
            supplierId: sId,
            supplierName: r.supplier?.name || "Unknown",
            noteNumbers: [],
            totalCost: 0,
            totalBarcode: 0,
            serviceCharge: 0,
            kukuluban: 0,
            tabungan: 0,
            baseProfit80: 0,
          };
        }
        if (r.noteNumber && !groups[sId].noteNumbers.includes(r.noteNumber)) {
          groups[sId].noteNumbers.push(r.noteNumber);
        }
        groups[sId].totalCost += r.cost || 0;
        groups[sId].totalBarcode += r.barcode || 0;
        groups[sId].serviceCharge += r.serviceCharge || 0;
        groups[sId].kukuluban += r.kukuluban || 0;
        groups[sId].tabungan += r.tabungan || 0;
        groups[sId].baseProfit80 += (r.cost || 0) - (r.barcode || 0);
      });

      setRows(Object.values(groups).sort((a, b) => a.supplierName.localeCompare(b.supplierName)));
    } catch (error) {
      console.error("Failed to fetch deduction for edit:", error);
      toast.error("Gagal memuat data potongan");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Use a separate effect for initial load or manual refresh
  useEffect(() => {
    if (isMounted) {
      if (editNote) {
        fetchDeductionForEdit(editNote);
      } else {
        fetchReports(startDate, endDate);
      }
    }
  }, [startDate, endDate, isMounted, fetchReports, editNote, fetchDeductionForEdit]);

  const updateField = (
    supplierId: string,
    field: "serviceCharge" | "kukuluban" | "tabungan",
    value: string,
  ) => {
    const numericValue = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setRows((prev) =>
      prev.map((row) =>
        row.supplierId === supplierId ? { ...row, [field]: numericValue } : row,
      ),
    );
  };

  const handleTableKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      rowIndex: number,
      field: string,
    ) => {
      const fields = ["serviceCharge", "kukuluban", "tabungan"];
      const fieldIndex = fields.indexOf(field);

      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (fieldIndex < fields.length - 1) {
          const nextInput = e.currentTarget
            .closest("td")
            ?.nextElementSibling?.querySelector("input");
          nextInput?.focus();
        } else {
          const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
          const targetInput = nextRow
            ?.querySelectorAll("td")[2]
            ?.querySelector("input"); // index 2 is now S.Charge (Total Cost is 1)
          if (targetInput) (targetInput as HTMLElement).focus();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (fieldIndex > 0) {
          const prevInput = e.currentTarget
            .closest("td")
            ?.previousElementSibling?.querySelector("input");
          prevInput?.focus();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
        const targetInput = nextRow
          ?.querySelectorAll("td")
          [fieldIndex + 2]?.querySelector("input");
        if (targetInput) (targetInput as HTMLElement).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevRow = e.currentTarget.closest("tr")?.previousElementSibling;
        const targetInput = prevRow
          ?.querySelectorAll("td")
          [fieldIndex + 2]?.querySelector("input");
        if (targetInput) (targetInput as HTMLElement).focus();
      }
    },
    [],
  );

  const handlePrint = () => {
    if (!savedNoteInfo) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = [...savedNoteInfo.details]
      .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
      .filter((r) => r.serviceCharge > 0 || r.kukuluban > 0 || r.tabungan > 0)
      .map((r, index) => {
        const total = r.serviceCharge + r.kukuluban + r.tabungan;
        return `
        <tr>
          <td>${index + 1}</td>
          <td>${r.supplierName}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(r.serviceCharge)}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(r.kukuluban)}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(r.tabungan)}</td>
          <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(total)}</strong></td>
        </tr>
      `;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Nota Potongan - ${savedNoteInfo.noteNumber}</title>
          <style>
            @page { size: portrait; margin: 0; }
            body { 
              font-family: sans-serif; 
              color: #333; 
              line-height: 1.4; 
              padding: 15mm; 
              font-size: 12px;
            }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px; }
            .meta-item { margin-bottom: 3px; }
            .meta-label { font-weight: bold; color: #666; display: inline-block; width: 80px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
            th { background: #f0f0f0; padding: 8px 5px; text-align: left; border: 1px solid #ddd; text-transform: uppercase; }
            td { padding: 6px 5px; border: 1px solid #ddd; }
            .total-row td { background: #f9f9f9; font-weight: bold; border-top: 2px solid #333; }
            .footer-sig { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig { border-top: 1px solid #333; width: 160px; text-align: center; padding-top: 8px; margin-top: 60px; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Nota Potongan Mitra Jjs - Jajanan Subuh</h1>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${savedNoteInfo.noteNumber}</strong></div>
            <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(savedNoteInfo.date), "dd MMMM yyyy")}</div>
            <div class="meta-item"><span class="meta-label">Periode:</span> ${format(new Date(savedNoteInfo.startDate), "dd/MM")} - ${format(new Date(savedNoteInfo.endDate), "dd/MM/yy")}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th width="150">Suplier</th>
                <th align="right">S.Charge</th>
                <th align="right">Kukuluban</th>
                <th align="right">Tabungan</th>
                <th align="right">Total Pot.</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="2" align="center">TOTAL KESELURUHAN</td>
                <td align="right">${new Intl.NumberFormat("id-ID").format(savedNoteInfo.totals.serviceCharge)}</td>
                <td align="right">${new Intl.NumberFormat("id-ID").format(savedNoteInfo.totals.kukuluban)}</td>
                <td align="right">${new Intl.NumberFormat("id-ID").format(savedNoteInfo.totals.tabungan)}</td>
                <td align="right">${new Intl.NumberFormat("id-ID").format(savedNoteInfo.totals.grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-sig">
            <div class="sig">Kasir / Admin</div>
            <div class="sig">Manager Toko</div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 9px; color: #999;">
            Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}
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
  };

  const handleSave = async () => {
    if (rows.length === 0) return;
    setIsSaving(true);
    try {
      const result = await updateAggregatedDeductionsAction(
        rows.map((r) => ({
          supplierId: r.supplierId,
          startDate,
          endDate,
          serviceCharge: r.serviceCharge,
          kukuluban: r.kukuluban,
          tabungan: r.tabungan,
          deductionDate: deductionDate,
          deductionNoteNumber: deductionNoteNumber,
        })),
      );

      if (result.success) {
        setSavedNoteInfo({
          noteNumber: deductionNoteNumber,
          date: deductionDate,
          startDate,
          endDate,
          totals: {
            serviceCharge: rows.reduce((sum, r) => sum + r.serviceCharge, 0),
            kukuluban: rows.reduce((sum, r) => sum + r.kukuluban, 0),
            tabungan: rows.reduce((sum, r) => sum + r.tabungan, 0),
            grandTotal: rows.reduce(
              (sum, r) => sum + r.serviceCharge + r.kukuluban + r.tabungan,
              0,
            ),
          },
          details: [...rows],
        });
        setIsSaveSuccessModalOpen(true);

        // Clear local storage and state on success
        localStorage.removeItem("jjs-potongan-rows");
        // Generate new note number for next batch
        const nextNum = Math.floor(Math.random() * 900) + 100;
        setDeductionNoteNumber(`POT-${format(new Date(), "ddMMyy")}${nextNum}`);
        setRows([]);
      } else {
        toast.error(result.error || "Gagal menyimpan potongan", {
          description: result.details,
        });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter(
      (r) =>
        r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.noteNumbers.some((n) =>
          n.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );
  }, [rows, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10 px-4">
      <Dialog
        open={isSaveSuccessModalOpen}
        onOpenChange={setIsSaveSuccessModalOpen}
      >
        <DialogContent className="bg-slate-950/90 backdrop-blur-xl border-white/10 rounded-[2.5rem] shadow-2xl max-w-md p-0 overflow-hidden">
          <div className="p-10 space-y-8 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-white text-center">
                  Berhasil Disimpan!
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-medium text-lg pt-2 text-center">
                  Nota Potongan{" "}
                  <span className="text-white font-bold">
                    {savedNoteInfo?.noteNumber}
                  </span>{" "}
                  telah aman di sistem.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => {
                  handlePrint();
                }}
                className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-lg shadow-xl shadow-rose-600/20 transition-all active:scale-95"
              >
                <Printer className="w-6 h-6 mr-3" /> CETAK NOTA
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSaveSuccessModalOpen(false);
                  router.push("/potongan");
                }}
                className="h-14 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-lg transition-all"
              >
                Selesai
              </Button>
            </div>
          </div>

          <div className="bg-white/[0.02] p-4 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 text-center">
              Jajanan Subuh • Management System
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Input{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-orange-400">
              Potongan
            </span>
          </h2>
          <p className="text-slate-400 font-medium">
            Penginputan potongan secara kolektif per suplier untuk rentang waktu
            terpilih.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              No. Nota
            </span>
            <div className="flex items-center px-4 h-12 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner group hover:bg-slate-900/80 transition-all">
              <Input
                value={deductionNoteNumber}
                onChange={(e) => setDeductionNoteNumber(e.target.value)}
                className="bg-transparent border-none focus-visible:ring-0 text-sm font-bold text-white p-0 h-auto w-32 placeholder:text-slate-600"
                placeholder="No. Nota..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Nota Potongan
            </span>
            <div className="flex items-center gap-3 px-4 h-12 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner group hover:bg-slate-900/80 transition-all">
              <Popover>
                <PopoverTrigger className="text-sm font-bold text-white focus:outline-none flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                  {format(new Date(deductionDate), "dd/MM/yy")}
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-slate-900 border-white/10"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={new Date(deductionDate)}
                    onSelect={(d) =>
                      d && setDeductionDate(format(d, "yyyy-MM-dd"))
                    }
                    initialFocus
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Periode Transaksi
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-2xl border border-white/5 h-12 shadow-inner">
              <div className="flex items-center gap-2 px-3 hover:bg-white/5 rounded-xl transition-all group">
                <span className="text-[9px] font-black uppercase text-slate-600">
                  Dari
                </span>
                <Popover>
                  <PopoverTrigger className="text-sm font-bold text-white focus:outline-none">
                    {format(new Date(startDate), "dd/MM/yy")}
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-slate-900 border-white/10"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={new Date(startDate)}
                      onSelect={(d) =>
                        d && setStartDate(format(d, "yyyy-MM-dd"))
                      }
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <div className="flex items-center gap-2 px-3 hover:bg-white/5 rounded-xl transition-all group">
                <span className="text-[9px] font-black uppercase text-slate-600">
                  Hingga
                </span>
                <Popover>
                  <PopoverTrigger className="text-sm font-bold text-white focus:outline-none">
                    {format(new Date(endDate), "dd/MM/yy")}
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-slate-900 border-white/10"
                    align="end"
                  >
                    <Calendar
                      mode="single"
                      selected={new Date(endDate)}
                      onSelect={(d) => d && setEndDate(format(d, "yyyy-MM-dd"))}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="relative group w-full md:w-56 mt-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            <Input
              placeholder="Cari suplier..."
              className="pl-11 pr-4 h-12 bg-slate-950/50 border-white/5 rounded-2xl focus:ring-rose-500/20 focus:border-rose-500/50 transition-all font-medium text-white shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Suplier & Nota
                  </TableHead>
                  <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Total Cost
                  </TableHead>
                  <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-rose-400">
                    S.Charge
                  </TableHead>
                  <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-orange-400">
                    Kukuluban
                  </TableHead>
                  <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-purple-400">
                    Tabungan
                  </TableHead>
                  <TableHead className="py-6 px-8 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-emerald-400">
                    Net Mitra
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24">
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                        <span className="font-medium">
                          Mengkalkulasi data per suplier...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-24 text-slate-500 font-medium italic"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-700" />
                        Tidak ada transaksi ditemukan.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row, idx) => {
                    const netMitra =
                      row.baseProfit80 -
                      (row.serviceCharge + row.kukuluban + row.tabungan);
                    return (
                      <TableRow
                        key={row.supplierId}
                        className="border-white/5 hover:bg-white/[0.03] transition-all group"
                      >
                        <TableCell className="py-6 px-8">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-white uppercase tracking-tight group-hover:text-rose-400 transition-colors">
                              {row.supplierName}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {row.noteNumbers.map((n) => (
                                <span
                                  key={n}
                                  className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-tighter"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-400">
                          {new Intl.NumberFormat("id-ID").format(row.totalCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            value={
                              row.serviceCharge === 0
                                ? ""
                                : new Intl.NumberFormat("id-ID").format(
                                    row.serviceCharge,
                                  )
                            }
                            placeholder="0"
                            onChange={(e) =>
                              updateField(
                                row.supplierId,
                                "serviceCharge",
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) =>
                              handleTableKeyDown(e, idx, "serviceCharge")
                            }
                            className="bg-slate-950/30 border-white/5 text-right font-black text-rose-400 focus:bg-rose-500/10 focus:border-rose-500/50 focus:ring-0 h-10 w-28 ml-auto rounded-xl transition-all"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            value={
                              row.kukuluban === 0
                                ? ""
                                : new Intl.NumberFormat("id-ID").format(
                                    row.kukuluban,
                                  )
                            }
                            placeholder="0"
                            onChange={(e) =>
                              updateField(
                                row.supplierId,
                                "kukuluban",
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) =>
                              handleTableKeyDown(e, idx, "kukuluban")
                            }
                            className="bg-slate-950/30 border-white/5 text-right font-black text-orange-400 focus:bg-orange-500/10 focus:border-orange-500/50 focus:ring-0 h-10 w-28 ml-auto rounded-xl transition-all"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            value={
                              row.tabungan === 0
                                ? ""
                                : new Intl.NumberFormat("id-ID").format(
                                    row.tabungan,
                                  )
                            }
                            placeholder="0"
                            onChange={(e) =>
                              updateField(
                                row.supplierId,
                                "tabungan",
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) =>
                              handleTableKeyDown(e, idx, "tabungan")
                            }
                            className="bg-slate-950/30 border-white/5 text-right font-black text-purple-400 focus:bg-purple-500/10 focus:border-purple-500/50 focus:ring-0 h-10 w-28 ml-auto rounded-xl transition-all"
                          />
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <span
                            className={cn(
                              "font-black text-lg transition-colors",
                              netMitra < 0
                                ? "text-rose-500"
                                : "text-emerald-400",
                            )}
                          >
                            {new Intl.NumberFormat("id-ID").format(netMitra)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <CheckCircle2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-white">Potongan</h4>
              <p className="text-xs text-slate-500">
                Nilai yang diinput akan disebar secara otomatis ke seluruh nota
                suplier dalam periode terpilih.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="block text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Tanggal Penyimpanan
              </span>
              <span className="text-sm font-bold text-white uppercase">
                {format(new Date(deductionDate), "dd MMM yyyy")}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Total Potongan (Agg)
              </span>
              <span className="text-xl font-black text-rose-400">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(
                  rows.reduce(
                    (sum, r) =>
                      sum + r.serviceCharge + r.kukuluban + r.tabungan,
                    0,
                  ),
                )}
              </span>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || rows.length === 0}
              className="h-14 px-10 rounded-[1.25rem] bg-linear-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black shadow-2xl shadow-rose-600/20 transition-all active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "SIMPAN"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
