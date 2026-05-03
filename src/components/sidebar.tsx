"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Database, 
  ReceiptText, 
  FileText, 
  Settings,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Setor", href: "/deposits", icon: Wallet },
  { name: "Data Master", href: "/master", icon: Database },
  { name: "Transaksi", href: "/transactions", icon: ReceiptText },
  { name: "Laporan", href: "/reports", icon: FileText },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-primary text-primary-foreground shadow-lg"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/50 backdrop-blur-3xl border-r border-white/5 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white">
                Jjs<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Manage</span>
              </h1>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-300 group",
                    isActive 
                      ? "bg-linear-to-r from-blue-600/20 to-purple-600/20 text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/20" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3.5 h-5 w-5 transition-transform duration-300", 
                    isActive ? "text-blue-400 scale-110" : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <Link 
                href="/settings"
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-500 to-purple-500 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-500/20" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">Administrator</p>
                  <p className="text-[10px] uppercase tracking-wider font-black text-blue-400/70">Master Admin</p>
                </div>
              </Link>
              
              <button 
                onClick={() => logoutAction()}
                className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group border border-transparent hover:border-red-500/20"
              >
                <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                Keluar Sesi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
