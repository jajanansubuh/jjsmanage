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
  Wallet,
  History,
  Coins,
  AlertCircle,
  Package,
  Scissors
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Data Master", href: "/master", icon: Database },
  { name: "Transaksi", href: "/transactions", icon: ReceiptText },
  { name: "Setor", href: "/deposits", icon: Wallet },
  { name: "Tabungan", href: "/savings", icon: Coins },
  { name: "Produk", href: "/produk", icon: Package },
  { name: "Potongan", href: "/potongan", icon: Scissors },
  { name: "Arsip", href: "/reports", icon: FileText },
  { name: "Riwayat", href: "/payouts", icon: History },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar({ role = "ADMIN", name = "Administrator" }: { role?: string, name?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Filter navigation based on role
  const filteredNavigation = navigation.filter(item => {
    const userRole = role?.toUpperCase();
    if (userRole === "SUPPLIER") {
      // Supplier sees ONLY Riwayat, Setor, Tabungan, Produk and Pengaturan
      return ["Riwayat", "Setor", "Tabungan", "Produk", "Pengaturan"].includes(item.name);
    }
    // Admin sees everything EXCEPT Riwayat
    return item.name !== "History" && item.name !== "Riwayat";
  }).map(item => {
    const userRole = role?.toUpperCase();
    // Ganti tulisan Setor menjadi Saldo untuk Supplier
    if (userRole === "SUPPLIER" && item.name === "Setor") {
      return { ...item, name: "Saldo" };
    }
    return item;
  });

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 active:scale-95 transition-all border border-white/10 shadow-lg"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2.5 pr-2">
          <span className="text-lg font-black tracking-tight text-white">
            Jjs<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Manage</span>
          </span>
          <div className="relative w-12 h-12 overflow-hidden">
            <Image
              src="/logojjsmanage.png"
              alt="JJS Manage Logo"
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/50 backdrop-blur-3xl border-r border-white/5 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-8">
            <div className="flex items-center gap-2.5 group">
              <div className="relative w-[72px] h-[72px] overflow-hidden group-hover:scale-110 transition-transform duration-300 shrink-0">
                <Image
                  src="/logojjsmanage.png"
                  alt="JJS Manage Logo"
                  fill
                  sizes="72px"
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-tight">
                Jjs<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Manage</span>
              </h1>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1.5">
            {filteredNavigation.map((item) => {
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
                href={role === "SUPPLIER" ? "/" : "/settings"}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-500 to-purple-500 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-500/20" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{name}</p>
                  <p className="text-[10px] uppercase tracking-wider font-black text-blue-400/70">{role === "SUPPLIER" ? "Supplier" : "Master Admin"}</p>
                </div>
              </Link>

              <button
                onClick={() => setIsLogoutDialogOpen(true)}
                className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group border border-transparent hover:border-red-500/20"
              >
                <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                Keluar
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

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-3xl shadow-2xl max-w-sm p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-white uppercase tracking-tight text-center">Yakin Ingin Keluar ?</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium pt-2 text-center">
                  Anda akan keluar dari sistem. Pastikan semua pekerjaan telah disimpan.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="flex-1 h-12 rounded-xl text-slate-400 font-bold hover:bg-white/5"
            >
              Batal
            </Button>
            <Button
              onClick={() => logoutAction()}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              YA, KELUAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
