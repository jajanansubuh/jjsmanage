import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SavingsInputFooterProps {
  totals: {
    tabungan: number;
    saversCount: number;
    totalSuppliers: number;
  };
  onSave: () => void;
  isSaving: boolean;
  hasRows: boolean;
}

export function SavingsInputFooter({ totals, onSave, isSaving, hasRows }: SavingsInputFooterProps) {
  const formatRupiah = (val: number) => new Intl.NumberFormat("id-ID").format(val);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
      {/* 1. Total Mitra Card */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Total Mitra Terdaftar
          </p>
          <p className="text-xl font-bold text-foreground mt-2">
            {totals.totalSuppliers} Mitra
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Mitra Menabung Card */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Mitra Menabung
          </p>
          <p className="text-xl font-bold text-blue-400 mt-2">
            {totals.saversCount} Mitra
          </p>
        </CardContent>
      </Card>

      {/* 3. Grand Total Tabungan Card */}
      <Card className="border border-blue-500/30 bg-blue-500/5 shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
            Total Tabungan Terkumpul
          </p>
          <p className="text-2xl font-black text-blue-400 mt-1">
            Rp {formatRupiah(totals.tabungan)}
          </p>
        </CardContent>
      </Card>

      {/* 4. Simpan Tabungan Action Button */}
      <Button
        type="button"
        disabled={!hasRows || isSaving}
        onClick={onSave}
        className="h-full min-h-[72px] px-6 rounded-xl font-bold text-base shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Menyimpan...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Simpan Tabungan</span>
          </>
        )}
      </Button>
    </div>
  );
}
