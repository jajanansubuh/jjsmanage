import { cn } from "@/lib/utils";

export function DeductionBadge({ icon: Icon, label, value, colorClass }: { icon: any; label: string; value: number; colorClass: string }) {
  if (!value || value === 0) return null;
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border", colorClass)}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
        <span className="text-sm font-black tracking-tight">
          -{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value)}
        </span>
      </div>
    </div>
  );
}
