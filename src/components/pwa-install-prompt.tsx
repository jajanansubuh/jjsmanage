"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { X, Download, Share, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // iOS doesn't support beforeinstallprompt, show manual instruction after 3s
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 2 seconds
      setTimeout(() => setShowPrompt(true), 2000);
    };

    // Fallback: If no event after 8 seconds, show manual help if not installed
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isIOSDevice) {
        setShowPrompt(true);
      }
    }, 8000);

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // If no prompt event, show manual instructions
      alert("Untuk menginstall di Android: \n1. Klik tombol titik tiga (⋮) di pojok kanan atas Chrome\n2. Pilih 'Instal aplikasi' atau 'Tambahkan ke Layar Utama'");
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Only show on login page to avoid disturbing user flow
  if (pathname !== "/login" || isStandalone || !showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Prompt Card */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        {/* Gradient accent top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <X size={16} />
        </button>

        <div className="p-6 pt-8 flex flex-col items-center text-center space-y-4">
          {/* App Icon */}
          <div className="relative">
            <div className="absolute inset-2 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-40" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-slate-800 shadow-lg">
              <Image
                src="/logojjsmanage.png"
                alt="JJS Manage"
                fill
                sizes="80px"
                className="object-contain p-1"
              />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white tracking-tight">
              Gunakan JjsManage App
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Install untuk akses cepat tanpa browser dan tampilan penuh seperti aplikasi native.
            </p>
          </div>

          {isIOS ? (
            /* iOS Instructions */
            <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-center">Cara Install di iOS:</p>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Share size={16} className="text-blue-400" />
                </div>
                <p className="text-sm text-slate-300">
                  Ketuk tombol <span className="font-bold text-white">Share</span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Download size={16} className="text-purple-400" />
                </div>
                <p className="text-sm text-slate-300">
                  Pilih <span className="font-bold text-white">Add to Home Screen</span>
                </p>
              </div>
            </div>
          ) : (
            /* Android/Chrome Install Button */
            <div className="w-full space-y-3 pt-1">
              {deferredPrompt ? (
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-2.5 h-13 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 active:scale-[0.97] transition-all duration-200"
                >
                  <Download size={18} />
                  Install Sekarang
                </button>
              ) : (
                /* Manual Help for Android */
                <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 text-left">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-center">Cara Install di Android:</p>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MoreVertical size={16} className="text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-300">
                      Klik <span className="font-bold text-white">titik tiga (⋮)</span> di pojok kanan atas browser
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Download size={16} className="text-purple-400" />
                    </div>
                    <p className="text-sm text-slate-300">
                      Pilih <span className="font-bold text-white">Instal aplikasi</span>
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={handleDismiss}
                className="w-full text-xs text-slate-500 hover:text-slate-300 font-medium py-2 transition-colors"
              >
                Nanti saja
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
