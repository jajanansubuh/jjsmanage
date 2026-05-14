import { Database, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

interface MasterTabsProps {
  supplierContent: ReactNode;
  cashierContent: ReactNode;
}

export function MasterTabs({ supplierContent, cashierContent }: MasterTabsProps) {
  return (
    <Tabs defaultValue="suppliers" className="w-full relative z-10">
      <TabsList className="flex w-fit p-1.5 mb-10 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl">
        <TabsTrigger value="suppliers" className="flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20">
          <Database className="w-4 h-4 mr-2" /> Data Suplier
        </TabsTrigger>
        <TabsTrigger value="cashiers" className="flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20">
          <UserPlus className="w-4 h-4 mr-2" /> Data Kasir
        </TabsTrigger>
      </TabsList>

      <TabsContent value="suppliers">
        {supplierContent}
      </TabsContent>

      <TabsContent value="cashiers">
        {cashierContent}
      </TabsContent>
    </Tabs>
  );
}
