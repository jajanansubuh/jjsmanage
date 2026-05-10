"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Download, Share, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
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

    // Check if dismissed recently (don't show again for 3 days)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < threeDays) return;
    }

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
      // Show prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
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

  if (isStandalone || !showPrompt) return null;

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
                src="/icon-512.png"
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
              Install JjsManage
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tambahkan ke layar utama untuk akses lebih cepat dan pengalaman seperti aplikasi native.
            </p>
          </div>

          {isIOS ? (
            /* iOS Instructions */
            <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cara Install di iOS:</p>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Share size={16} className="text-blue-400" />
                </div>
                <p className="text-sm text-slate-300">
                  Ketuk tombol <span className="font-bold text-white">Share</span> di browser
                </p>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Download size={16} className="text-purple-400" />
                </div>
                <p className="text-sm text-slate-300">
                  Pilih <span className="font-bold text-white">&quot;Add to Home Screen&quot;</span>
                </p>
              </div>
            </div>
          ) : (
            /* Android/Chrome Install Button */
            <div className="w-full space-y-3 pt-1">
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2.5 h-13 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 active:scale-[0.97] transition-all duration-200"
              >
                <Download size={18} />
                Install Sekarang
              </button>
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
