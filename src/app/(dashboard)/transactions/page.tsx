"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger
} from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save, Plus, Trash2, Calculator, Search, ChevronDown, Check, ArrowUpDown, Calendar as CalendarIcon, Download, Printer, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveTransactionAction } from "@/lib/actions/transactions";

interface ReportRow {
  id: string;
  supplierId: string;
  revenue: number;
  barcode: number;
  cost: number;
  serviceCharge: number;
  kukuluban: number;
  tabungan: number;
  profit80: number;
  profit20: number;
}

function SupplierCombobox({ value, onValueChange, suppliers }: { value: string, onValueChange: (val: string) => void, suppliers: { id: string, name: string, ownerName?: string | null }[] }) {
  const [search, setSearch] = useState("");

  // Clear search when value is reset (e.g. after adding transaction)
  useEffect(() => {
    if (!value) setSearch("");
  }, [value]);

  const filtered = search
    ? suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.ownerName && s.ownerName.toLowerCase().includes(search.toLowerCase())))
    : suppliers;

  return (
    <Combobox value={value} onValueChange={onValueChange}>
      <ComboboxTrigger id="supplier-combobox-trigger" className="w-full bg-white/5 border-white/10 h-10 text-white hover:bg-white/10 transition-all">
        {suppliers.find(s => s.id === value)?.name || "Pilih Suplier"}
      </ComboboxTrigger>
      <ComboboxContent className="w-[300px] bg-slate-900/95 backdrop-blur-xl border-white/10 p-2 shadow-2xl">
        <div className="flex items-center border-b border-white/10 mb-2 px-2 pb-2">
          <Search className="w-4 h-4 mr-2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari suplier..."
            className="border-none focus-visible:outline-none h-8 p-0 bg-transparent text-white flex-1 placeholder:text-muted-foreground"
            onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when typing
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center italic">Belum ada data suplier</div>
          ) : (
            filtered.map((s) => (
              <ComboboxItem key={s.id} value={s.id} className="cursor-pointer hover:bg-blue-600/30 py-2 px-3 rounded-md transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-white">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{s.ownerName || "-"}</span>
                </div>
              </ComboboxItem>
            ))
          )}
        </div>
      </ComboboxContent>
    </Combobox>
  );
}

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editNoteParam = searchParams.get("edit");
  const [isMounted, setIsMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!editNoteParam);
  const [editNoteNumber, setEditNoteNumber] = useState<string | null>(editNoteParam || null);
  const [suppliers, setSuppliers] = useState<{ id: string, name: string, ownerName?: string | null }[]>([]);
  const [cashiers, setCashiers] = useState<{ id: string, name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedCashiers, setSelectedCashiers] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [noteNumber, setNoteNumber] = useState(editNoteParam || "");
  const [notes, setNotes] = useState("");
  const editInitializedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: "",
    revenue: "",
    barcode: "0",
    cost: "0",
    serviceCharge: "0",
    kukuluban: "0",
    tabungan: "0"
  });

  // Save Success Modal State
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] = useState(false);
  const [savedNoteInfo, setSavedNoteInfo] = useState<{ noteNumber: string, date: string, cashierName: string } | null>(null);

  useEffect(() => {
    if (isEditMode) return; // Don't auto-generate note number in edit mode
    const fetchNextNote = async () => {
      try {
        const res = await fetch(`/api/reports/next-note?date=${selectedDate}`);
        const data = await res.json();
        const datePrefix = format(new Date(selectedDate), "ddMMyyyy");
        setNoteNumber(`${datePrefix}${data.nextNumber}`);
      } catch (error) {
        console.error("Failed to fetch next note number:", error);
      }
    };
    fetchNextNote();
  }, [selectedDate, isEditMode]);

  const revenueRef = useRef<HTMLInputElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const serviceChargeRef = useRef<HTMLInputElement>(null);
  const kukulubanRef = useRef<HTMLInputElement>(null);
  const tabunganRef = useRef<HTMLInputElement>(null);

  const toggleSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);

    setRows(prevRows => {
      return [...prevRows].sort((a, b) => {
        const nameA = suppliers.find(s => s.id === a.supplierId)?.name || "";
        const nameB = suppliers.find(s => s.id === b.supplierId)?.name || "";
        return newOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    });
  };

  useEffect(() => {
    setIsMounted(true);
    // Fetch Suppliers
    fetch("/api/suppliers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
          setSuppliers(sortedData);
        }
      });

    // Fetch Cashiers
    fetch("/api/cashiers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCashiers(data);
          // Only set default if nothing in localStorage
          const savedCashiers = localStorage.getItem("jjs-transactions-cashiers");
          if (!savedCashiers && data.length > 0) {
            setSelectedCashiers([data[0].id]);
          }
        }
      });

    // Check for edit mode — load rows from API directly
    if (editNoteParam && !editInitializedRef.current) {
      editInitializedRef.current = true;
      const fetchEditData = async () => {
        try {
          const res = await fetch(`/api/reports?noteNumber=${encodeURIComponent(editNoteParam)}`);
          const data = await res.json();
          const reportsData = Array.isArray(data) ? data : (data.reports || []);
          
          if (reportsData.length > 0) {
            setIsEditMode(true);
            setEditNoteNumber(editNoteParam);
            setNoteNumber(editNoteParam);
            if (reportsData[0].date) {
              setSelectedDate(format(new Date(reportsData[0].date), "yyyy-MM-dd"));
            }
            if (reportsData[0].notes) {
              setNotes(reportsData[0].notes);
            }
            setRows(reportsData.map((r: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              supplierId: r.supplierId,
              revenue: r.revenue || 0,
              barcode: r.barcode || 0,
              cost: r.cost || 0,
              serviceCharge: r.serviceCharge || 0,
              kukuluban: r.kukuluban || 0,
              tabungan: r.tabungan || 0,
              profit80: r.profit80 || 0,
              profit20: r.profit20 || 0,
            })));
            toast.info(`Mode edit nota: ${editNoteParam}`);
          } else {
            toast.error("Data nota tidak ditemukan");
            setIsEditMode(false);
            setEditNoteNumber(null);
          }
        } catch (e) {
          console.error("Failed to fetch edit data from API:", e);
          toast.error("Gagal memuat data nota");
          setIsEditMode(false);
          setEditNoteNumber(null);
        }
      };
      fetchEditData();
      return; // Don't load other local storage rows
    }

    // Load from localStorage (only when not in edit mode)
    if (!editNoteParam) {
      const savedRows = localStorage.getItem("jjs-transactions-rows");
      if (savedRows) setRows(JSON.parse(savedRows));
    }

    const savedCashiers = localStorage.getItem("jjs-transactions-cashiers");
    if (savedCashiers) setSelectedCashiers(JSON.parse(savedCashiers));
  }, [editNoteParam]);

  // Save to localStorage (only when not in edit mode)
  useEffect(() => {
    if (isMounted && !isEditMode && !editNoteParam) {
      localStorage.setItem("jjs-transactions-rows", JSON.stringify(rows));
    }
  }, [rows, isMounted, isEditMode, editNoteParam]);


  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("jjs-transactions-cashiers", JSON.stringify(selectedCashiers));
    }
  }, [selectedCashiers, isMounted]);

  const handleFormNumberChange = (field: "revenue" | "barcode" | "cost" | "serviceCharge" | "kukuluban" | "tabungan", rawValue: string) => {
    const numericString = rawValue.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, [field]: numericString }));
  };

  const handleAddTransaction = () => {
    if (!formData.supplierId) {
      toast.error("Pilih suplier terlebih dahulu");
      return;
    }

    const rev = parseInt(formData.revenue.replace(/\D/g, ""), 10) || 0;
    const cst = parseInt(formData.cost.replace(/\D/g, ""), 10) || 0;
    const bc = parseInt(formData.barcode.replace(/\D/g, ""), 10) || 0;
    const sc = parseInt(formData.serviceCharge.replace(/\D/g, ""), 10) || 0;
    const kukuluban = parseInt(formData.kukuluban.replace(/\D/g, ""), 10) || 0;
    const tabungan = parseInt(formData.tabungan.replace(/\D/g, ""), 10) || 0;

    if (rows.some(r => r.supplierId === formData.supplierId)) {
      toast.error("Suplier ini sudah ada di dalam daftar transaksi");
      return;
    }

    const profit80 = cst - (bc + sc + kukuluban + tabungan);
    const profit20 = rev - cst;

    setRows([...rows, {
      id: Math.random().toString(36).substr(2, 9),
      supplierId: formData.supplierId,
      revenue: rev,
      barcode: bc,
      cost: cst,
      serviceCharge: sc,
      kukuluban,
      tabungan,
      profit80,
      profit20
    }]);

    setFormData({
      supplierId: "",
      revenue: "",
      barcode: "",
      cost: "",
      serviceCharge: "",
      kukuluban: "",
      tabungan: ""
    });

    // Return focus to supplier combobox
    setTimeout(() => {
      document.getElementById("supplier-combobox-trigger")?.focus();
    }, 0);
  };

  const handleRevenueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      costRef.current?.focus();
    }
  };

  const handleCostKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      barcodeRef.current?.focus();
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      serviceChargeRef.current?.focus();
    }
  };

  const handleServiceChargeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      kukulubanRef.current?.focus();
    }
  };

  const handleKukulubanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tabunganRef.current?.focus();
    }
  };

  const handleTabunganKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTransaction();
    }
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRowField = (id: string, field: keyof ReportRow, value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setRows(prevRows => prevRows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: numericValue };
        // Recalculate profits
        updatedRow.profit80 = updatedRow.cost - (updatedRow.barcode + updatedRow.serviceCharge + updatedRow.kukuluban + updatedRow.tabungan);
        updatedRow.profit20 = updatedRow.revenue - updatedRow.cost;
        return updatedRow;
      }
      return row;
    }));
  };

  const calculateTotal = (field: keyof ReportRow) => {
    return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
  };

  const handleExportExcel = () => {
    const exportData = rows
      .filter(r => r.supplierId && (r.revenue > 0 || r.cost > 0 || r.barcode > 0))
      .map((r, i) => {
        const supplierName = suppliers.find(s => s.id === r.supplierId)?.name || "Unknown";
        return {
          No: i + 1,
          "Nama Suplier": supplierName,
          Pendapatan: r.revenue,
          Cost: r.cost,
          Barcode: r.barcode,
          "Service Charge": r.serviceCharge,
          Kukuluban: r.kukuluban,
          Tabungan: r.tabungan,
          "Mitra Jjs": r.profit80,
          "Toko": r.profit20
        };
      });

    if (exportData.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    exportData.push({
      No: "",
      "Nama Suplier": "TOTAL",
      Pendapatan: calculateTotal("revenue"),
      Cost: calculateTotal("cost"),
      Barcode: calculateTotal("barcode"),
      "Service Charge": calculateTotal("serviceCharge"),
      Kukuluban: calculateTotal("kukuluban"),
      Tabungan: calculateTotal("tabungan"),
      "Mitra Jjs": calculateTotal("profit80"),
      "Toko": calculateTotal("profit20")
    } as any);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");

    const cashierName = selectedCashiers.length > 0
      ? cashiers.find(c => c.id === selectedCashiers[0])?.name || "Kasir"
      : "Kasir";

    const fileName = `Transaksi_${cashierName}_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Berhasil export ke Excel");
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cashierNames = selectedCashiers.length > 0
      ? selectedCashiers.map(id => cashiers.find(c => c.id === id)?.name).join(" & ")
      : "-";

    const totalRevenue = calculateTotal("revenue");
    const totalCost = calculateTotal("cost");
    const totalBarcode = calculateTotal("barcode");
    const totalServiceCharge = calculateTotal("serviceCharge");
    const totalKukuluban = calculateTotal("kukuluban");
    const totalTabungan = calculateTotal("tabungan");
    const totalProfit80 = calculateTotal("profit80");
    const totalProfit20 = calculateTotal("profit20");

    // Sort rows alphabetically by supplier name before printing
    const sortedRows = [...rows].sort((a, b) => {
      const nameA = suppliers.find(s => s.id === a.supplierId)?.name || "";
      const nameB = suppliers.find(s => s.id === b.supplierId)?.name || "";
      return nameA.localeCompare(nameB);
    });

    const rowsHtml = sortedRows.map((row, index) => {
      const supplierName = suppliers.find(s => s.id === row.supplierId)?.name || "-";
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${supplierName}</td>
          <td align="right">${new Intl.NumberFormat('id-ID').format(row.revenue)}</td>
          <td align="right">${new Intl.NumberFormat('id-ID').format(row.cost)}</td>
          <td align="right">${new Intl.NumberFormat('id-ID').format(row.barcode)}</td>
          <td align="right">${new Intl.NumberFormat('id-ID').format(row.serviceCharge)}</td>
          <td align="right">${new Intl.NumberFormat('id-ID').format(row.kukuluban)}</td>
          <td align="right">${new Intl.NumberFormat('id-ID').format(row.tabungan)}</td>
          <td align="right">${new Intl.NumberFormat('id-ID').format(row.profit80)}</td>
          <td align="right">${new Intl.NumberFormat('id-ID').format(row.profit20)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Nota Transaksi - ${noteNumber}</title>
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
            .total-row td { background: #f9f9f9; font-weight: bold; border-top: 2px solid #333; }
            .totals-summary { margin-top: 20px; text-align: right; font-weight: bold; font-size: 14px; }
            .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; }
            .sig { border-top: 1px solid #333; width: 160px; text-align: center; padding-top: 8px; margin-top: 50px; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Mitra Jjs - Jajanan Subuh</h1>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${noteNumber}</strong></div>
            <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(selectedDate), "dd MMMM yyyy")}</div>
            <div class="meta-item"><span class="meta-label">Kasir:</span> <strong>${cashierNames}</strong></div>
          </div>

          ${notes ? `<div class="notes-box"><strong>Catatan:</strong> "${notes}"</div>` : ''}

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
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="2" align="center">TOTAL</td>
                <td align="right">${new Intl.NumberFormat('id-ID').format(totalRevenue)}</td>
                <td align="right">${new Intl.NumberFormat('id-ID').format(totalCost)}</td>
                <td align="right">${new Intl.NumberFormat('id-ID').format(totalBarcode)}</td>
                <td align="right">${new Intl.NumberFormat('id-ID').format(totalServiceCharge)}</td>
                <td align="right">${new Intl.NumberFormat('id-ID').format(totalKukuluban)}</td>
                <td align="right">${new Intl.NumberFormat('id-ID').format(totalTabungan)}</td>
                <td align="right">${new Intl.NumberFormat('id-ID').format(totalProfit80)}</td>
                <td align="right">${new Intl.NumberFormat('id-ID').format(totalProfit20)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-sig">
            <div class="sig">Kasir<br/>(${cashierNames})</div>
            <div class="sig">Admin</div>
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
    if (isSaving) return;
    
    const validRows = rows.filter(r => r.supplierId && (r.revenue > 0 || r.cost > 0 || r.barcode > 0));
    if (validRows.length === 0) {
      toast.error("Tidak ada data transaksi untuk disimpan");
      return;
    }

    // Validate all supplier IDs exist
    const invalidRows = validRows.filter(r => !suppliers.some(s => s.id === r.supplierId));
    if (invalidRows.length > 0) {
      toast.error(`${invalidRows.length} transaksi memiliki suplier yang tidak valid. Hapus dan tambahkan ulang.`);
      return;
    }

    setIsSaving(true);
    try {
      const currentNoteNumber = noteNumber || `NT-${format(new Date(), "yyyyMMddHHmmss")}`;

      const result = await saveTransactionAction({
        isEditMode: isEditMode,
        editNoteNumber: editNoteNumber,
        noteNumber: currentNoteNumber,
        date: selectedDate,
        notes: notes,
        rows: validRows.map(r => ({
          supplierId: r.supplierId,
          revenue: r.revenue,
          barcode: r.barcode,
          cost: r.cost,
          serviceCharge: r.serviceCharge,
          kukuluban: r.kukuluban,
          tabungan: r.tabungan,
          profit80: r.profit80,
          profit20: r.profit20
        }))
      });

      if (result.success) {
        toast.success(isEditMode ? "Transaksi berhasil diperbarui" : "Laporan berhasil disimpan");
        
        // Prepare info for printing modal
        const cashierName = selectedCashiers.length > 0
          ? cashiers.find(c => c.id === selectedCashiers[0])?.name || "Kasir"
          : "Kasir";
        
        setSavedNoteInfo({
          noteNumber: currentNoteNumber,
          date: selectedDate,
          cashierName: cashierName
        });
        setIsSaveSuccessModalOpen(true);
      } else {
        toast.error(result.error || "Gagal menyimpan laporan");
        if (result.details) {
          console.error("Save error details:", result.details);
        }
      }
    } catch (error) {
      console.error("Save report exception:", error);
      toast.error(`Terjadi kesalahan sistem saat menyimpan`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishAndReset = () => {
    setIsSaveSuccessModalOpen(false);
    setSavedNoteInfo(null);
    setRows([]);
    setNotes("");
    localStorage.removeItem("jjs-transactions-rows");
    
    if (isEditMode) {
      setIsEditMode(false);
      setEditNoteNumber(null);
      router.push("/reports");
    } else {
      const fetchNextNote = async () => {
        const res = await fetch(`/api/reports/next-note?date=${selectedDate}`);
        const data = await res.json();
        const datePrefix = format(new Date(selectedDate), "ddMMyyyy");
        setNoteNumber(`${datePrefix}${data.nextNumber}`);
      };
      fetchNextNote();
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* ... existing content ... */}
      <Dialog open={isSaveSuccessModalOpen} onOpenChange={(open) => !open && handleFinishAndReset()}>
        <DialogContent className="bg-slate-950/90 backdrop-blur-xl border-white/10 rounded-[2.5rem] shadow-2xl max-w-md p-0 overflow-hidden">
          <div className="p-10 space-y-8 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-white text-center">Berhasil Disimpan!</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium text-lg pt-2 text-center">
                  Nota <span className="text-white font-bold">{savedNoteInfo?.noteNumber}</span> telah aman di sistem.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => {
                  handlePrint();
                  // We stay in the modal after print to let user choose to finish
                }}
                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-95"
              >
                <Printer className="w-6 h-6 mr-3" /> CETAK NOTA
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleFinishAndReset}
                className="h-14 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-lg transition-all"
              >
                Selesai & Lanjut Baru
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

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-white/90 print:text-black print:text-center print:mb-4 print:text-3xl print:uppercase">
            {isEditMode ? 'Edit Transaksi' : 'Laporan Mitra Jjs'}
          </h2>
          {isEditMode && (
            <span className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              Mode Edit — {editNoteNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 no-print">
          {isEditMode && (
            <Button
              onClick={() => {
                setIsEditMode(false);
                setEditNoteNumber(null);
                setRows([]);
                router.push("/transactions");
              }}
              variant="outline"
              className="border-red-500/20 hover:bg-red-500/10 bg-slate-900 text-red-400 shadow-lg"
            >
              Batal Edit
            </Button>
          )}
          <Button onClick={handlePrint} variant="outline" className="border-white/10 hover:bg-white/5 bg-slate-900 text-white shadow-lg">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="border-white/10 hover:bg-white/5 bg-slate-900 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className={cn(
            "shadow-lg px-8",
            isEditMode
              ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
            isSaving && "opacity-50 cursor-not-allowed"
          )}>
            {isSaving ? (
              <><div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {isEditMode ? 'Simpan Perubahan' : 'Simpan Laporan'}</>
            )}
          </Button>
        </div>
      </div>

      <Card className="border-border/40 bg-card/20 backdrop-blur-xl shadow-2xl print:border-0 print:shadow-none">
        <CardContent className="p-8 print:p-0">
          {/* Header Section: Tanggal & Kasir */}
          <div className="flex flex-wrap items-center justify-between gap-8 mb-10 pb-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Tanggal</span>
              <div className="no-print">
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "w-[180px] flex items-center justify-start text-left font-semibold text-lg bg-transparent border-0 border-b border-white/10 hover:bg-transparent hover:text-white hover:border-white/30 text-white transition-all px-0 rounded-none h-auto pb-1 focus-visible:ring-0 cursor-pointer",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-white/50" />
                    {selectedDate ? format(new Date(selectedDate), "dd/MM/yyyy") : <span>Pilih Tanggal</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 shadow-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(selectedDate)}
                      onSelect={(date: Date | undefined) => date && setSelectedDate(format(date, "yyyy-MM-dd"))}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="hidden print:block text-lg font-bold text-black">
                {selectedDate ? format(new Date(selectedDate), "dd MMMM yyyy") : "-"}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Kasir</span>
              <div className="no-print">
                <DropdownMenu>
                  <DropdownMenuTrigger className="bg-transparent border-none p-0 h-auto text-white text-lg font-bold focus:outline-none flex items-center gap-2 group">
                    <span className="border-b-2 border-white/10 group-hover:border-white/30 transition-all pb-1">
                      {selectedCashiers.length > 0
                        ? selectedCashiers.map(id => cashiers.find(c => c.id === id)?.name).join(" & ")
                        : "Pilih Kasir"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-white/10 text-white min-w-[200px] p-2 shadow-2xl">
                    {cashiers.map(c => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-blue-600/30 rounded-md cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          const isSelected = selectedCashiers.includes(c.id);
                          if (isSelected) {
                            setSelectedCashiers(selectedCashiers.filter(id => id !== c.id));
                          } else {
                            setSelectedCashiers([...selectedCashiers, c.id]);
                          }
                        }}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          selectedCashiers.includes(c.id) ? "bg-blue-500 border-blue-500" : "border-white/20"
                        )}>
                          {selectedCashiers.includes(c.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-semibold">{c.name}</span>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="hidden print:block text-lg font-bold text-black">
                {selectedCashiers.length > 0
                  ? selectedCashiers.map(id => cashiers.find(c => c.id === id)?.name).join(" & ")
                  : "-"}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">No Nota</span>
              <div className="no-print">
                <Input
                  value={noteNumber}
                  readOnly
                  placeholder="Generating..."
                  className="bg-transparent border-0 border-b border-white/10 text-white text-lg font-bold focus:ring-0 rounded-none h-auto pb-1 w-[150px] placeholder:text-white/20 cursor-default"
                />
              </div>
              <div className="hidden print:block text-lg font-bold text-black">
                {noteNumber || "-"}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mb-10 pb-6 border-b border-white/5 no-print">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase ml-1">Catatan Nota</span>
              <Input
                placeholder="Tambahkan catatan khusus untuk nota ini ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 text-sm rounded-xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Print Notes (Hidden in UI) */}
          {notes && (
            <div className="hidden print:block mb-6 pb-4 border-b border-gray-200">
              <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Catatan:</span>
              <p className="text-sm font-medium text-black italic">"{notes}"</p>
            </div>
          )}

          {/* Form Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-white/5 no-print shadow-inner">
            <div className="col-span-1 md:col-span-3">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Suplier</Label>
              <SupplierCombobox
                value={formData.supplierId}
                onValueChange={(val) => {
                  setFormData({ ...formData, supplierId: val });
                  setTimeout(() => {
                    revenueRef.current?.focus();
                  }, 50);
                }}
                suppliers={suppliers}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Pendapatan</Label>
              <Input
                ref={revenueRef}
                value={formData.revenue ? new Intl.NumberFormat("id-ID").format(Number(formData.revenue)) : ""}
                onChange={(e) => handleFormNumberChange("revenue", e.target.value)}
                onKeyDown={handleRevenueKeyDown}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10 text-sm"
                placeholder="0"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Cost</Label>
              <Input
                ref={costRef}
                value={formData.cost ? new Intl.NumberFormat("id-ID").format(Number(formData.cost)) : ""}
                onChange={(e) => handleFormNumberChange("cost", e.target.value)}
                onKeyDown={handleCostKeyDown}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10 text-sm"
                placeholder="0"
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Barcode</Label>
              <Input
                ref={barcodeRef}
                value={formData.barcode ? new Intl.NumberFormat("id-ID").format(Number(formData.barcode)) : ""}
                onChange={(e) => handleFormNumberChange("barcode", e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10 text-sm"
                placeholder="0"
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block truncate" title="Service Charge">S.Charge</Label>
              <Input
                ref={serviceChargeRef}
                value={formData.serviceCharge ? new Intl.NumberFormat("id-ID").format(Number(formData.serviceCharge)) : ""}
                onChange={(e) => handleFormNumberChange("serviceCharge", e.target.value)}
                onKeyDown={handleServiceChargeKeyDown}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10 text-sm"
                placeholder="0"
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block truncate">Kukuluban</Label>
              <Input
                ref={kukulubanRef}
                value={formData.kukuluban ? new Intl.NumberFormat("id-ID").format(Number(formData.kukuluban)) : ""}
                onChange={(e) => handleFormNumberChange("kukuluban", e.target.value)}
                onKeyDown={handleKukulubanKeyDown}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10 text-sm"
                placeholder="0"
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block truncate">Tabungan</Label>
              <Input
                ref={tabunganRef}
                value={formData.tabungan ? new Intl.NumberFormat("id-ID").format(Number(formData.tabungan)) : ""}
                onChange={(e) => handleFormNumberChange("tabungan", e.target.value)}
                onKeyDown={handleTabunganKeyDown}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10 text-sm"
                placeholder="0"
              />
            </div>
            <div className="col-span-1 md:col-span-1 flex items-end">
              <Button onClick={handleAddTransaction} title="Tambah Transaksi" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 px-0 flex justify-center items-center">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="w-[40px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">No</TableHead>
                  <TableHead className="min-w-[150px] print:min-w-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <div className="flex items-center cursor-pointer hover:text-white transition-colors" onClick={toggleSort}>
                      Suplier <ArrowUpDown className="ml-2 w-3 h-3 no-print" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pendapatan</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cost</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Barcode</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">S.Charge</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kukuluban</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tabungan</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mitra Jjs</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-emerald-400">Toko</TableHead>
                  <TableHead className="w-[40px] no-print"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-slate-500 italic">
                      Belum ada data transaksi. Silakan tambah melalui form di atas.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-bold text-white print:text-black">
                          {suppliers.find(s => s.id === row.supplierId)?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.revenue ? new Intl.NumberFormat("id-ID").format(row.revenue) : "0"}
                          onChange={(e) => updateRowField(row.id, "revenue", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input");
                              nextInput?.focus();
                            }
                          }}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.cost ? new Intl.NumberFormat("id-ID").format(row.cost) : "0"}
                          onChange={(e) => updateRowField(row.id, "cost", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input");
                              nextInput?.focus();
                            }
                          }}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.barcode ? new Intl.NumberFormat("id-ID").format(row.barcode) : "0"}
                          onChange={(e) => updateRowField(row.id, "barcode", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input");
                              nextInput?.focus();
                            }
                          }}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.serviceCharge ? new Intl.NumberFormat("id-ID").format(row.serviceCharge) : "0"}
                          onChange={(e) => updateRowField(row.id, "serviceCharge", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input");
                              nextInput?.focus();
                            }
                          }}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.kukuluban ? new Intl.NumberFormat("id-ID").format(row.kukuluban) : "0"}
                          onChange={(e) => updateRowField(row.id, "kukuluban", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input");
                              nextInput?.focus();
                            }
                          }}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.tabungan ? new Intl.NumberFormat("id-ID").format(row.tabungan) : "0"}
                          onChange={(e) => updateRowField(row.id, "tabungan", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              document.getElementById("supplier-combobox-trigger")?.focus();
                            }
                          }}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-white/70 print:text-black">
                        {new Intl.NumberFormat("id-ID").format(row.profit80)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-400 print:text-black">
                        {new Intl.NumberFormat("id-ID").format(row.profit20)}
                      </TableCell>
                      <TableCell className="no-print">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(index)}
                          className="text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {/* Total Row */}
                <TableRow className="bg-white/5 border-t-2 border-white/10 font-bold print:bg-gray-100">
                  <TableCell colSpan={2} className="text-center text-xs tracking-widest uppercase py-6 print:text-black">Total</TableCell>
                  <TableCell className="text-right text-lg print:text-black">{new Intl.NumberFormat("id-ID").format(calculateTotal("revenue"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/60">{new Intl.NumberFormat("id-ID").format(calculateTotal("cost"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/60">{new Intl.NumberFormat("id-ID").format(calculateTotal("barcode"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/60">{new Intl.NumberFormat("id-ID").format(calculateTotal("serviceCharge"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/60">{new Intl.NumberFormat("id-ID").format(calculateTotal("kukuluban"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/60">{new Intl.NumberFormat("id-ID").format(calculateTotal("tabungan"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/80">{new Intl.NumberFormat("id-ID").format(calculateTotal("profit80"))}</TableCell>
                  <TableCell className="text-right text-lg text-emerald-400">{new Intl.NumberFormat("id-ID").format(calculateTotal("profit20"))}</TableCell>
                  <TableCell className="no-print"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <TransactionsPageContent />
    </Suspense>
  );
}
