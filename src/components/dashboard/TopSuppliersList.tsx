import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TopSuppliersList({ topSuppliers }: { topSuppliers: any[] }) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader className="border-b border-border bg-muted/30 py-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Pendapatan tertinggi
          </CardTitle>
          <Link 
            href="/master" 
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }), 
              "h-8 rounded-lg text-primary font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center"
            )}
          >
            Data Suplier
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {topSuppliers && topSuppliers.length > 0 ? (
            topSuppliers.map((s, index) => (
              <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.transactionCount} Transaksi</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumSignificantDigits: 3 }).format(s.totalRevenue)}
                  </p>
                  <p className="text-[10px] text-success font-bold uppercase tracking-wider">Terpopuler</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-medium">Belum ada data suplier untuk periode ini.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
