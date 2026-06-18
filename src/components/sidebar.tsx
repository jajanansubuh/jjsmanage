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
  Wallet,
  History,
  Coins,
  AlertCircle,
  Package,
  Scissors,
  Printer
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { logoutAction } from "@/lib/actions/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  { name: "Cetak", href: "/cetak", icon: Printer },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar({
  role = "ADMIN",
  name = "Administrator",
  permissions = []
}: {
  role?: string,
  name?: string,
  permissions?: string[]
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Ensure permissions is an array
  const userPermissions = Array.isArray(permissions) ? permissions : [];

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Filter navigation based on permissions or role
  const filteredNavigation = navigation.filter(item => {
    // If user has specific granular permissions set, use them
    if (userPermissions.length > 0) {
      return userPermissions.includes(item.href);
    }

    // Otherwise fallback to legacy role-based logic
    const userRole = (role || "").toUpperCase();

    if (userRole === "SUPPLIER") {
      const allowedPaths = ["/payouts", "/deposits", "/savings", "/potongan", "/produk", "/cetak", "/settings"];
      return allowedPaths.includes(item.href);
    }

    if (userRole === "CASHIER") {
      const forbiddenPaths = ["/master", "/payouts", "/settings"];
      return !forbiddenPaths.includes(item.href);
    }

    return item.href !== "/payouts";
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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-30 flex items-center justify-between px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95 transition-all"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2.5 pr-2">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Jjs<span className="text-primary">Manage</span>
          </span>
          <div className="relative w-12 h-12 overflow-hidden">
            <Image
              src="/logojjsmanage.png"
              alt="JJS Manage Logo"
              fill
              sizes="48px"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-[#0f1117] border-r border-white/5 transition-transform duration-300 ease-in-out lg:translate-x-0 h-[100dvh]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-5 py-6 lg:py-7">
            <div className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 lg:w-14 lg:h-14 overflow-hidden group-hover:scale-105 transition-transform duration-300 shrink-0">
                <Image
                  src="/logojjsmanage.png"
                  alt="JJS Manage Logo"
                  fill
                  sizes="(max-width: 1024px) 44px, 56px"
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-black tracking-tight text-white leading-tight">
                  Jjs<span className="text-emerald-400">Manage</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/60 mt-0.5">Sukabumi</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar pb-4 min-h-0">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 px-3.5 py-2 text-[13px] font-bold rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {/* Active indicator dot (left side) */}
                  {!isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-full bg-emerald-400 transition-all duration-200 group-hover:h-5" />
                  )}
                  <item.icon className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-emerald-400"
                  )} />
                  <span className="uppercase tracking-wider text-[11px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Profile */}
          <div className="p-3 shrink-0 border-t border-white/5 bg-white/[0.02]">
            <div className="flex flex-col gap-2">
              <Link
                href={role === "SUPPLIER" ? "/" : "/settings"}
                className="flex items-center gap-3 group p-2.5 rounded-xl hover:bg-white/5 transition-all duration-200"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xs font-black text-emerald-400 ring-1 ring-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                    {name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0f1117] rounded-full" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors duration-200">{name}</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate mt-0.5">{role === "SUPPLIER" ? "Supplier" : "Administrator"}</p>
                </div>
              </Link>

              <button
                onClick={() => setIsLogoutDialogOpen(true)}
                className="flex items-center justify-center w-full gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 active:scale-[0.98]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>

              {/* Version and Copyright Info */}
              <div className="pt-1 text-center text-[10px] text-slate-500 font-medium">
                <p>JjsManage v2.9.0 &middot; &copy; 2026</p>
                <p className="text-slate-500/60">
                  Powered by{" "}
                  <a
                    href="https://nadhivadam.my.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-500/70 hover:text-emerald-400 transition-colors duration-200 font-semibold underline decoration-emerald-500/20 hover:decoration-emerald-400/60 underline-offset-2"
                  >
                    ndhvbase
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="max-w-sm">
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-warning" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Sign Out</DialogTitle>
                <DialogDescription>
                  Are you sure you want to sign out?
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="p-6 pt-0 flex flex-col gap-3">
            <Button
              onClick={() => logoutAction()}
              variant="destructive"
              className="w-full"
            >
              Sign Out
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
