import { Clock, History, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CetakQueueListProps {
  queueItems: any[];
  isQueueLoading: boolean;
  onRefresh: () => void;
  onClear: () => void;
  onAddFromQueue: (item: any) => void;
  onMarkAsDone: (id: string) => void;
}

export function CetakQueueList({
  queueItems,
  isQueueLoading,
  onRefresh,
  onClear,
  onAddFromQueue,
  onMarkAsDone
}: CetakQueueListProps) {
  return (
    <div className="space-y-6 no-print">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Antrean Dari Suplier</h3>
            <p className="text-slate-400 text-xs font-medium">Klik untuk menambahkan ke daftar cetak.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isQueueLoading} className="text-slate-400 hover:text-white">
            <History className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear} className="text-slate-500 hover:text-red-400">
            Bersihkan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queueItems.length === 0 ? (
          <div className="col-span-full py-8 text-center bg-slate-900/20 rounded-2xl border border-dashed border-white/5 text-slate-500 italic">
            Antrean kosong
          </div>
        ) : (
          queueItems.map((item) => (
            <Card 
              key={item.id} 
              className="bg-slate-900/40 border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group"
              onClick={() => onAddFromQueue(item)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-purple-400 uppercase truncate">{item.supplier?.name}</p>
                  <p className="font-bold text-white truncate">{item.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{item.code || "-"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-white/5 px-2 py-1 rounded-lg font-black text-white text-xs">x{item.qty}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onMarkAsDone(item.id); }}
                    className="h-6 w-6 p-0 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
