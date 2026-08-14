import { Database, UserPlus, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

interface MasterTabsProps {
  supplierContent: ReactNode;
  cashierContent: ReactNode;
  productContent: ReactNode;
}

export function MasterTabs({ supplierContent, cashierContent, productContent }: MasterTabsProps) {
  return (
    <Tabs defaultValue="suppliers" className="w-full relative z-10">
      <div className="overflow-x-auto no-scrollbar pb-1 mb-6 sm:mb-8 max-w-full">
        <TabsList className="flex w-max p-1.5 bg-zinc-900/90 border border-white/10 rounded-2xl shadow-xl">
          <TabsTrigger value="suppliers" className="flex items-center px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white shrink-0 cursor-pointer">
            <Database className="w-4 h-4 mr-2" /> Data Suplier
          </TabsTrigger>
          <TabsTrigger value="cashiers" className="flex items-center px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white shrink-0 cursor-pointer">
            <UserPlus className="w-4 h-4 mr-2" /> Data Kasir
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white shrink-0 cursor-pointer">
            <Package className="w-4 h-4 mr-2" /> Data Produk
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="suppliers">
        {supplierContent}
      </TabsContent>

      <TabsContent value="cashiers">
        {cashierContent}
      </TabsContent>

      <TabsContent value="products">
        {productContent}
      </TabsContent>
    </Tabs>
  );
}
