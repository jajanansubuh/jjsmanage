"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ReceiptText, 
  Wallet, 
  Coins, 
  Menu 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sidebar } from "./sidebar";

const navItems = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Transaksi", href: "/transactions", icon: ReceiptText },
  { name: "Setor", href: "/deposits", icon: Wallet },
  { name: "Tabungan", href: "/savings", icon: Coins },
];

export function MobileBottomNav({ role, name, permissions }: { role?: string, name?: string, permissions?: string[] }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pointer-events-none">
        <nav className="flex items-center justify-around bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl h-16 px-2 shadow-2xl pointer-events-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300",
                  isActive ? "text-blue-400" : "text-slate-500"
                )}
              >
                <div className={cn(
                  "p-1 rounded-xl transition-all duration-300",
                  isActive ? "bg-blue-500/10 scale-110" : "bg-transparent"
                )}>
                  <item.icon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => {
              // Trigger the existing sidebar's open state
              // Since they are separate components, we might need a better way to sync
              // For now, let's just make a button that opens a "More" menu or similar
              // But the user already has a hamburger in the top bar.
              // Maybe we just let them use the top bar for Menu.
            }}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-slate-500"
          >
            <div className="p-1 rounded-xl">
              <Menu size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
          </button>
        </nav>
      </div>
      
      {/* Safe area spacer for content */}
      <div className="lg:hidden h-20" />
    </>
  );
}
