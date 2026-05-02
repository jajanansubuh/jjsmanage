"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Save, Plus, Trash2, Calculator, Search, ChevronDown, Check, ArrowUpDown, Calendar as CalendarIcon, Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

interface ReportRow {
  id: string;
  supplierId: string;
  revenue: number;
  barcode: number;
  cost: number;
  profit80: number;
  profit20: number;
}

function SupplierCombobox({ value, onValueChange, suppliers }: { value: string, onValueChange: (val: string) => void, suppliers: { id: string, name: string, ownerName?: string | null }[] }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.ownerName && s.ownerName.toLowerCase().includes(search.toLowerCase())))
    : suppliers;

  return (
    <Combobox value={value} onValueChange={onValueChange}>
      <ComboboxTrigger className="w-full bg-white/5 border-white/10 h-10 text-white hover:bg-white/10 transition-all">
        {suppliers.find(s => s.id === value)?.name || "Pilih Suplier"}
      </ComboboxTrigger>
      <ComboboxContent className="w-[300px] bg-slate-900/95 backdrop-blur-2xl border-white/10 p-2 shadow-2xl">
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

export default function TransactionsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string, name: string, ownerName?: string | null }[]>([]);
  const [cashiers, setCashiers] = useState<{ id: string, name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedCashiers, setSelectedCashiers] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [rows, setRows] = useState<ReportRow[]>([
    { id: "1", supplierId: "", revenue: 0, barcode: 0, cost: 0, profit80: 0, profit20: 0 }
  ]);

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
          if (sortedData.length > 0) {
            setRows(sortedData.map(s => ({
              id: Math.random().toString(36).substr(2, 9),
              supplierId: s.id,
              revenue: 0,
              barcode: 0,
              cost: 0,
              profit80: 0,
              profit20: 0
            })));
          }
        }
      });

    // Fetch Cashiers
    fetch("/api/cashiers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCashiers(data);
          if (data.length > 0) setSelectedCashiers([data[0].id]);
        }
      });
  }, []);

  const updateRow = (index: number, field: keyof ReportRow, value: any) => {
    const newRows = [...rows];
    const row = { ...newRows[index], [field]: value };

    if (field === "cost" || field === "barcode" || field === "revenue") {
      const rev = field === "revenue" ? parseFloat(value) || 0 : row.revenue;
      const bc = field === "barcode" ? parseFloat(value) || 0 : row.barcode;
      const cst = field === "cost" ? parseFloat(value) || 0 : row.cost;

      row.profit80 = cst - bc;
      row.profit20 = rev - cst;
    }

    newRows[index] = row;
    setRows(newRows);
  };

  const handleNumberChange = (index: number, field: keyof ReportRow, rawValue: string) => {
    // Remove non-digit characters
    const numericString = rawValue.replace(/\D/g, "");
    const numericValue = numericString ? parseInt(numericString, 10) : 0;
    updateRow(index, field, numericValue);
  };

  const addRow = () => {
    setRows([...rows, {
      id: Math.random().toString(36).substr(2, 9),
      supplierId: "",
      revenue: 0,
      barcode: 0,
      cost: 0,
      profit80: 0,
      profit20: 0
    }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
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
          "Bagi Hasil 80%": r.profit80,
          "Bagi Hasil 20%": r.profit20,
          Barcode: r.barcode,
          Cost: r.cost
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
      "Bagi Hasil 80%": calculateTotal("profit80"),
      "Bagi Hasil 20%": calculateTotal("profit20"),
      Barcode: calculateTotal("barcode"),
      Cost: calculateTotal("cost")
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
    window.print();
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.supplierId && (r.revenue > 0 || r.cost > 0 || r.barcode > 0));
    if (validRows.length === 0) {
      toast.error("Tidak ada data transaksi untuk disimpan");
      return;
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        body: JSON.stringify(validRows.map(r => ({
          ...r,
          date: selectedDate,
          cashierId: selectedCashiers[0] || ""
        }))),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        toast.success("Laporan berhasil disimpan");
        const sortedSuppliers = [...suppliers].sort((a, b) => {
          return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        });
        setRows(sortedSuppliers.length > 0 ? sortedSuppliers.map(s => ({
          id: Math.random().toString(36).substr(2, 9),
          supplierId: s.id,
          revenue: 0,
          barcode: 0,
          cost: 0,
          profit80: 0,
          profit20: 0
        })) : [{ id: "1", supplierId: "", revenue: 0, barcode: 0, cost: 0, profit80: 0, profit20: 0 }]);
      } else {
        toast.error("Gagal menyimpan laporan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white/90 print:text-black print:text-center print:mb-4 print:text-3xl print:uppercase">
            Laporan Bagi Hasil
          </h2>
        </div>
        <div className="flex items-center gap-4 no-print">
          <Button onClick={handlePrint} variant="outline" className="border-white/10 hover:bg-white/5 bg-slate-900 text-white shadow-lg">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="border-white/10 hover:bg-white/5 bg-slate-900 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 px-8">
            <Save className="w-4 h-4 mr-2" /> Simpan Laporan
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
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="w-[60px] text-xs font-bold uppercase tracking-wider text-muted-foreground">No</TableHead>
                  <TableHead className="min-w-[280px] print:min-w-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <div className="flex items-center cursor-pointer hover:text-white transition-colors" onClick={toggleSort}>
                      Nama Suplier
                      <ArrowUpDown className="ml-2 w-3 h-3 no-print" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Pendapatan</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Bagi Hasil 80%</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground text-emerald-400">Bagi Hasil 20%</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Barcode</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Cost</TableHead>
                  <TableHead className="w-[50px] no-print"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="no-print">
                        <SupplierCombobox
                          value={row.supplierId}
                          onValueChange={(val) => updateRow(index, "supplierId", val)}
                          suppliers={suppliers}
                        />
                      </div>
                      <div className="hidden print:block font-bold text-black">
                        {suppliers.find(s => s.id === row.supplierId)?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <input
                        type="text"
                        value={row.revenue ? new Intl.NumberFormat("id-ID").format(row.revenue) : ""}
                        onChange={(e) => handleNumberChange(index, "revenue", e.target.value)}
                        className="w-full bg-transparent text-right font-semibold text-white focus:outline-none border-b border-transparent focus:border-blue-500/50 transition-all placeholder:text-white/20 print:hidden"
                        placeholder="0"
                      />
                      <div className="hidden print:block text-right font-semibold text-black">
                        {row.revenue ? new Intl.NumberFormat("id-ID").format(row.revenue) : "0"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-white/70">
                      {new Intl.NumberFormat("id-ID").format(row.profit80)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-400">
                      {new Intl.NumberFormat("id-ID").format(row.profit20)}
                    </TableCell>
                    <TableCell className="text-right">
                      <input
                        type="text"
                        value={row.barcode ? new Intl.NumberFormat("id-ID").format(row.barcode) : ""}
                        onChange={(e) => handleNumberChange(index, "barcode", e.target.value)}
                        className="w-full bg-transparent text-right font-semibold text-white/70 focus:outline-none border-b border-transparent focus:border-blue-500/50 transition-all placeholder:text-white/20 print:hidden"
                        placeholder="0"
                      />
                      <div className="hidden print:block text-right font-semibold text-black/70">
                        {row.barcode ? new Intl.NumberFormat("id-ID").format(row.barcode) : "0"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <input
                        type="text"
                        value={row.cost ? new Intl.NumberFormat("id-ID").format(row.cost) : ""}
                        onChange={(e) => handleNumberChange(index, "cost", e.target.value)}
                        className="w-full bg-transparent text-right font-semibold text-white/70 focus:outline-none border-b border-transparent focus:border-blue-500/50 transition-all placeholder:text-white/20 print:hidden"
                        placeholder="0"
                      />
                      <div className="hidden print:block text-right font-semibold text-black/70">
                        {row.cost ? new Intl.NumberFormat("id-ID").format(row.cost) : "0"}
                      </div>
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
                ))}

                {/* Total Row */}
                <TableRow className="bg-white/5 border-t-2 border-white/10 font-bold print:bg-gray-100">
                  <TableCell colSpan={2} className="text-center text-xs tracking-widest uppercase py-6 print:text-black">Total</TableCell>
                  <TableCell className="text-right text-lg print:text-black">{new Intl.NumberFormat("id-ID").format(calculateTotal("revenue"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/80">{new Intl.NumberFormat("id-ID").format(calculateTotal("profit80"))}</TableCell>
                  <TableCell className="text-right text-lg text-emerald-400">{new Intl.NumberFormat("id-ID").format(calculateTotal("profit20"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/60">{new Intl.NumberFormat("id-ID").format(calculateTotal("barcode"))}</TableCell>
                  <TableCell className="text-right text-lg text-white/60">{new Intl.NumberFormat("id-ID").format(calculateTotal("cost"))}</TableCell>
                  <TableCell className="no-print"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="mt-8 no-print">
            <Button
              variant="outline"
              onClick={addRow}
              className="bg-slate-900 border-white/10 hover:bg-white/5 text-white/80 font-bold px-6 py-5 rounded-xl shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Tambah Baris
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
