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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save, Plus, Trash2, Calculator, Search, ChevronDown, Check, ArrowUpDown, Calendar as CalendarIcon, Download, Printer, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";
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
  items?: { name: string; qtyBeli: number; qtyJual: number; retureJual: number }[];
  importedSupplierName?: string;
}

function SupplierCombobox({ value, onValueChange, suppliers, id, onKeyDown }: { value: string, onValueChange: (val: string) => void, suppliers: { id: string, name: string, ownerName?: string | null }[], id?: string, onKeyDown?: (e: React.KeyboardEvent) => void }) {
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
      <ComboboxTrigger id={id} onKeyDown={onKeyDown} className="w-full bg-white/5 border-white/10 h-10 text-white hover:bg-white/10 transition-all">
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
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
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

  const previewProfit80 = (Number(formData.cost) || 0) - (
    (Number(formData.barcode) || 0) + 
    (Number(formData.serviceCharge) || 0) + 
    (Number(formData.kukuluban) || 0) + 
    (Number(formData.tabungan) || 0)
  );
  const previewProfit20 = (Number(formData.revenue) || 0) - (Number(formData.cost) || 0);

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
              items: r.items || [],
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

  const handleFormKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (field === "supplier") {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        revenueRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        // Focus first row in table if exists
        const firstRowInput = document.querySelector("tbody tr:first-child td:nth-child(3) input") as HTMLInputElement;
        firstRowInput?.focus();
      }
    }
  };

  const handleRevenueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      costRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      document.getElementById("supplier-combobox-trigger")?.focus();
    }
  };

  const handleCostKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      barcodeRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      revenueRef.current?.focus();
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      serviceChargeRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      costRef.current?.focus();
    }
  };

  const handleServiceChargeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      kukulubanRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      barcodeRef.current?.focus();
    }
  };

  const handleKukulubanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      tabunganRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      serviceChargeRef.current?.focus();
    }
  };

  const handleTabunganKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTransaction();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      kukulubanRef.current?.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      // focus add button
      (e.currentTarget.parentElement?.nextElementSibling?.querySelector("button") as HTMLElement)?.focus();
    }
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    if (rows.length === 0) return;
    setIsClearAllDialogOpen(true);
  };

  const confirmClearAll = () => {
    setRows([]);
    setIsClearAllDialogOpen(false);
    toast.success("Semua data transaksi telah dihapus");
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

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    const fields = ["revenue", "cost", "barcode", "serviceCharge", "kukuluban", "tabungan"];
    const fieldIndex = fields.indexOf(field);

    if (e.key === "ArrowRight" || e.key === "Enter") {
      e.preventDefault();
      if (fieldIndex < fields.length - 1) {
        const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input");
        nextInput?.focus();
      } else if (e.key === "Enter") {
        // If Enter on last column, go to next row first column if exists
        if (rowIndex < rows.length - 1) {
          const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
          const targetInput = nextRow?.querySelectorAll("td")[2]?.querySelector("input");
          targetInput?.focus();
        } else {
          // Or back to top form
          document.getElementById("supplier-combobox-trigger")?.focus();
        }
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (fieldIndex > 0) {
        const prevInput = e.currentTarget.closest("td")?.previousElementSibling?.querySelector("input");
        prevInput?.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < rows.length - 1) {
        const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
        const targetInput = nextRow?.querySelectorAll("td")[fieldIndex + 2]?.querySelector("input");
        targetInput?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIndex > 0) {
        const prevRow = e.currentTarget.closest("tr")?.previousElementSibling;
        const targetInput = prevRow?.querySelectorAll("td")[fieldIndex + 2]?.querySelector("input");
        targetInput?.focus();
      }
    }
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

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          toast.error("File Excel kosong");
          return;
        }

        // Helper to find value by multiple possible header names (case-insensitive)
        const findValue = (row: any, ...possibleNames: string[]) => {
          const keys = Object.keys(row);
          for (const name of possibleNames) {
            const lowerName = name.toLowerCase();
            const foundKey = keys.find(k => k.toLowerCase().trim() === lowerName || k.toLowerCase().trim().startsWith(lowerName));
            if (foundKey) return row[foundKey];
          }
          return undefined;
        };

        // Use a Map to group by supplier
        const groupedData = new Map<string, ReportRow>();

        data.forEach((row) => {
          let supplierName = (findValue(row, "Nama Supl", "Suplier", "Supplier", "Supl") || "").toString().trim();
          
          // Clean up "A1. Total" or "A1." to just "A1"
          if (supplierName.toLowerCase().endsWith(". total")) {
            supplierName = supplierName.substring(0, supplierName.length - 8).trim();
          } else if (supplierName.endsWith(".")) {
            supplierName = supplierName.substring(0, supplierName.length - 1).trim();
          }

          if (!supplierName) return;

          const itemName = findValue(row, "Nama Barang", "Produk", "Barang");
          const qtyBeli = Number(findValue(row, "Qty Beli", "Beli", "Qty", "Jumlah Beli", "Stok", "Stock", "Masuk", "Jml Beli", "Awal", "Total Beli", "Supply")) || 0;
          const qtyJual = Number(findValue(row, "Qty Jual", "Jual", "Laku", "Terjual", "Jumlah Jual")) || 0;
          const retureJual = Number(findValue(row, "Reture Jual", "Retur Jual", "Return Jual", "Retur", "Kembali")) || 0;
          const rev = Number(findValue(row, "Pendapatan", "Omset", "Revenue")) || 0;
          const cst = Number(findValue(row, "Cost", "Harga Pokok")) || 0;
          const bc = Number(findValue(row, "Barcode", "Barcod")) || 0;
          const sc = Number(findValue(row, "Service Ch", "Service Charge", "S.Charge")) || 0;
          const kuk = Number(findValue(row, "Kukuluban", "Kukulub")) || 0;
          const tab = Number(findValue(row, "Tabungan", "Tabung")) || 0;

          if (groupedData.has(supplierName)) {
            const existing = groupedData.get(supplierName)!;
            // Sum values
            existing.revenue += rev;
            existing.cost += cst;
            existing.barcode += bc;
            existing.serviceCharge += sc;
            existing.kukuluban += kuk;
            existing.tabungan += tab;
            
            if (itemName && itemName.toString().toLowerCase() !== "total") {
              existing.items?.push({ name: itemName.toString(), qtyBeli, qtyJual, retureJual });
            }
          } else {
            // New supplier entry
            let foundSupplier = null;
            foundSupplier = suppliers.find(s => s.name.toLowerCase().trim() === supplierName.toLowerCase());
            if (!foundSupplier && supplierName.length >= 2) {
              foundSupplier = suppliers.find(s => {
                const sName = s.name.toLowerCase().trim();
                const iName = supplierName.toLowerCase();
                return sName.includes(iName) || iName.includes(sName);
              });
            }

            groupedData.set(supplierName, {
              id: Math.random().toString(36).substr(2, 9),
              supplierId: foundSupplier?.id || "",
              importedSupplierName: foundSupplier ? undefined : supplierName,
              revenue: rev,
              cost: cst,
              barcode: bc,
              serviceCharge: sc,
              kukuluban: kuk,
              tabungan: tab,
              profit80: 0,
              profit20: 0,
              items: itemName && itemName.toString().toLowerCase() !== "total" ? [{ name: itemName.toString(), qtyBeli, qtyJual, retureJual }] : []
            });
          }
        });

        // Convert Map back to array and calculate profits
        const newRows: ReportRow[] = Array.from(groupedData.values()).map(row => {
          row.profit80 = row.cost - (row.barcode + row.serviceCharge + row.kukuluban + row.tabungan);
          row.profit20 = row.revenue - row.cost;
          return row;
        });

        if (newRows.length > 0) {
          // Check for duplicate suppliers in imported data
          const existingSupplierIds = new Set(rows.map(r => r.supplierId));
          const filteredNewRows = newRows.filter(r => {
            if (r.supplierId && existingSupplierIds.has(r.supplierId)) {
              return false;
            }
            return true;
          });

          if (filteredNewRows.length < newRows.length) {
            toast.info(`${newRows.length - filteredNewRows.length} suplier sudah ada di daftar, dilewati.`);
          }

          setRows([...rows, ...filteredNewRows]);
          toast.success(`Berhasil mengimport ${filteredNewRows.length} transaksi`);
        } else {
          toast.error("Format Excel tidak sesuai atau data tidak ditemukan");
        }
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Gagal membaca file Excel");
      }
      e.target.value = ""; // Reset input
    };
    reader.readAsBinaryString(file);
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
          profit20: r.profit20,
          items: r.items || []
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
          <Button onClick={handleExportExcel} variant="outline" className="border-white/10 hover:bg-white/5 bg-slate-900 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Import Excel"
            />
            <Button variant="outline" className="border-white/10 hover:bg-white/5 bg-slate-900 text-white shadow-lg pointer-events-none">
              <Upload className="w-4 h-4 mr-2" /> Import Excel
            </Button>
          </div>
          <Button onClick={handleClearAll} variant="outline" className="border-red-500/20 hover:bg-red-500/10 bg-slate-900 text-red-400 shadow-lg">
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-blue-500/20 transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Total UMKM</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">{rows.length}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-emerald-500/20 transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Calculator className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Total Pendapatan</p>
              <h4 className="text-2xl font-black text-white tracking-tighter">Rp {new Intl.NumberFormat("id-ID").format(calculateTotal("revenue"))}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-purple-500/20 transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Total Toko (20%)</p>
              <h4 className="text-2xl font-black text-emerald-400 tracking-tighter">Rp {new Intl.NumberFormat("id-ID").format(calculateTotal("profit20"))}</h4>
            </div>
          </CardContent>
        </Card>
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
                id="supplier-combobox-trigger"
                value={formData.supplierId}
                onValueChange={(val) => {
                  setFormData({ ...formData, supplierId: val });
                  setTimeout(() => {
                    revenueRef.current?.focus();
                  }, 50);
                }}
                onKeyDown={(e) => handleFormKeyDown(e, "supplier")}
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

            {/* Live Profit Preview */}
            <div className="col-span-1 md:col-span-12 mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Preview Mitra Jjs:</span>
                  <span className={cn("text-blue-400", previewProfit80 < 0 && "text-red-400")}>
                    Rp {new Intl.NumberFormat("id-ID").format(previewProfit80)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Preview Toko:</span>
                  <span className={cn("text-emerald-400", previewProfit20 < 0 && "text-red-400")}>
                    Rp {new Intl.NumberFormat("id-ID").format(previewProfit20)}
                  </span>
                </div>
              </div>
              <span className="text-slate-600 lowercase font-medium italic">Kalkulasi otomatis saat Anda mengetik</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="w-[30px] text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">No</TableHead>
                  <TableHead className="min-w-[120px] print:min-w-0 text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">
                    <div className="flex items-center cursor-pointer hover:text-white transition-colors" onClick={toggleSort}>
                      Suplier <ArrowUpDown className="ml-1 w-2.5 h-2.5 no-print" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">Pendapatan</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">Cost</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">Barcode</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">S.Charge</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">Kukuluban</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">Tabungan</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground px-2">Mitra Jjs</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-wider text-muted-foreground text-emerald-400 px-2">Toko</TableHead>
                  <TableHead className="w-[30px] no-print px-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-20 text-slate-500 font-medium italic">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-700" />
                        Belum ada data transaksi. Silakan tambah melalui form di atas.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="font-medium text-slate-500 py-3 px-2 text-[11px]">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-white print:text-black min-w-[150px]">
                            {suppliers.find(s => s.id === row.supplierId) ? (
                              row.items && row.items.length > 0 ? (
                                <Dialog>
                                  <DialogTrigger className="cursor-pointer hover:text-blue-400 transition-colors border-b border-dashed border-white/20 pb-0.5 flex items-center gap-2 group/text bg-transparent border-0 p-0 text-white font-bold h-auto">
                                    {suppliers.find(s => s.id === row.supplierId)?.name}
                                    <Plus className="w-3 h-3 text-white/20 group-hover/text:text-blue-400 transition-colors" />
                                  </DialogTrigger>
                                  <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl p-0 overflow-hidden rounded-3xl shadow-2xl">
                                    <div className="p-8 bg-gradient-to-br from-blue-600/20 to-transparent border-b border-white/5">
                                      <div className="flex items-center gap-4 mb-2">
                                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                                          <Calculator className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                          <DialogTitle className="text-2xl font-black tracking-tight">Rincian Produk</DialogTitle>
                                          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Suplier: {suppliers.find(s => s.id === row.supplierId)?.name}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-8">
                                      <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                          <Table>
                                            <TableHeader className="sticky top-0 bg-slate-900 z-10">
                                              <TableRow className="border-white/5 bg-white/5">
                                                <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest py-4">Nama Barang</TableHead>
                                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest py-4">Qty Beli</TableHead>
                                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest py-4">Qty Jual</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {row.items.map((item, idx) => (
                                                <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02]">
                                                  <TableCell className="font-bold text-slate-200 py-4">{item.name}</TableCell>
                                                  <TableCell className="text-center font-black text-slate-400">{item.qtyBeli}</TableCell>
                                                  <TableCell className="text-center font-black text-emerald-400">{item.qtyJual}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                      <div className="mt-8 flex justify-end">
                                        <DialogFooter>
                                          <Button onClick={() => document.body.click()} className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 rounded-xl border border-white/10 transition-all">
                                            Tutup
                                          </Button>
                                        </DialogFooter>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                suppliers.find(s => s.id === row.supplierId)?.name
                              )
                            ) : (
                              <div className="space-y-2">
                                {row.importedSupplierName && (
                                  <div className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded-sm inline-block">
                                    Import: {row.importedSupplierName}
                                  </div>
                                )}
                                <SupplierCombobox 
                                  value={row.supplierId} 
                                  onValueChange={(val) => {
                                    setRows(prev => prev.map(r => r.id === row.id ? { ...r, supplierId: val, importedSupplierName: undefined } : r));
                                  }} 
                                  suppliers={suppliers} 
                                />
                              </div>
                            )}
                          </div>
                          {row.items && row.items.length > 0 && (
                            <div className="text-[9px] text-blue-400/60 font-medium uppercase tracking-tighter">
                              {row.items.length} Produk Terlampir
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.revenue ? new Intl.NumberFormat("id-ID").format(row.revenue) : "0"}
                          onChange={(e) => updateRowField(row.id, "revenue", e.target.value)}
                          onKeyDown={(e) => handleTableKeyDown(e, index, "revenue")}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.cost ? new Intl.NumberFormat("id-ID").format(row.cost) : "0"}
                          onChange={(e) => updateRowField(row.id, "cost", e.target.value)}
                          onKeyDown={(e) => handleTableKeyDown(e, index, "cost")}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.barcode ? new Intl.NumberFormat("id-ID").format(row.barcode) : "0"}
                          onChange={(e) => updateRowField(row.id, "barcode", e.target.value)}
                          onKeyDown={(e) => handleTableKeyDown(e, index, "barcode")}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.serviceCharge ? new Intl.NumberFormat("id-ID").format(row.serviceCharge) : "0"}
                          onChange={(e) => updateRowField(row.id, "serviceCharge", e.target.value)}
                          onKeyDown={(e) => handleTableKeyDown(e, index, "serviceCharge")}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.kukuluban ? new Intl.NumberFormat("id-ID").format(row.kukuluban) : "0"}
                          onChange={(e) => updateRowField(row.id, "kukuluban", e.target.value)}
                          onKeyDown={(e) => handleTableKeyDown(e, index, "kukuluban")}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Input
                          type="text"
                          value={row.tabungan ? new Intl.NumberFormat("id-ID").format(row.tabungan) : "0"}
                          onChange={(e) => updateRowField(row.id, "tabungan", e.target.value)}
                          onKeyDown={(e) => handleTableKeyDown(e, index, "tabungan")}
                          className="bg-transparent border-none text-right h-8 text-sm font-semibold text-white/70 px-2 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30 rounded-md transition-all outline-none w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-white/70 print:text-black">
                        {new Intl.NumberFormat("id-ID").format(row.profit80)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-400 print:text-black">
                        {new Intl.NumberFormat("id-ID").format(row.profit20)}
                      </TableCell>
                      <TableCell className="no-print px-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(index)}
                          className="w-8 h-8 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {/* Total Row */}
                <TableRow className="bg-slate-950/60 border-t-2 border-white/10 font-bold print:bg-gray-100">
                  <TableCell colSpan={2} className="text-center text-[9px] font-black tracking-[0.1em] uppercase py-6 print:text-black text-slate-400 px-2">Total</TableCell>
                  <TableCell className="text-right text-base font-black text-white py-6 px-2">{new Intl.NumberFormat("id-ID").format(calculateTotal("revenue"))}</TableCell>
                  <TableCell className="text-right text-sm font-bold text-white/40 py-6 px-2">{new Intl.NumberFormat("id-ID").format(calculateTotal("cost"))}</TableCell>
                  <TableCell className="text-right text-sm font-bold text-white/40 py-6 px-2">{new Intl.NumberFormat("id-ID").format(calculateTotal("barcode"))}</TableCell>
                  <TableCell className="text-right text-sm font-bold text-white/40 py-6 px-2">{new Intl.NumberFormat("id-ID").format(calculateTotal("serviceCharge"))}</TableCell>
                  <TableCell className="text-right text-sm font-bold text-white/40 py-6 px-2">{new Intl.NumberFormat("id-ID").format(calculateTotal("kukuluban"))}</TableCell>
                  <TableCell className="text-right text-sm font-bold text-white/40 py-6 px-2">{new Intl.NumberFormat("id-ID").format(calculateTotal("tabungan"))}</TableCell>
                  <TableCell className="text-right text-base font-black text-blue-400/80 py-6 px-2">{new Intl.NumberFormat("id-ID").format(calculateTotal("profit80"))}</TableCell>
                  <TableCell className="text-right text-lg font-black text-emerald-400 py-6 px-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{new Intl.NumberFormat("id-ID").format(calculateTotal("profit20"))}</TableCell>
                  <TableCell className="no-print px-2"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 animate-pulse">
              <Trash2 className="w-10 h-10 text-red-400" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black tracking-tight">Hapus Semua Data?</DialogTitle>
              <p className="text-slate-400 font-medium">
                Tindakan ini akan menghapus seluruh daftar transaksi yang ada di tabel saat ini secara permanen.
              </p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <Button 
                onClick={confirmClearAll}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                Ya, Hapus Semua
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsClearAllDialogOpen(false)}
                className="w-full h-12 text-slate-400 hover:text-white hover:bg-white/5 font-bold rounded-xl transition-all"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
