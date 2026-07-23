"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Wrench, RefreshCw, Clock, Calendar } from "lucide-react";

interface MaintenanceInfo {
  enabled: boolean;
  message: string;
  estimatedFinish: string | null;
}

export default function MaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [info, setInfo] = useState<MaintenanceInfo | null>(null);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [secondsToRefresh, setSecondsToRefresh] = useState(30);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/maintenance/status");
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
        setServerTime(new Date());
        
        // If maintenance is turned off, redirect to home page
        if (data && !data.enabled) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error fetching maintenance status:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSecondsToRefresh(30);
    }
  }, [router]);

  // Initial fetch and server time clock tick
  useEffect(() => {
    fetchStatus();

    const clockInterval = setInterval(() => {
      setServerTime((prev) => (prev ? new Date(prev.getTime() + 1000) : new Date()));
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [fetchStatus]);

  // Auto refresh timer every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsToRefresh((prev) => {
        if (prev <= 1) {
          fetchStatus();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleManualRefresh = () => {
    fetchStatus(true);
  };

  const formatServerTime = (date: Date | null) => {
    if (!date) return "--:--:--";
    return date.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }) + " WIB";
  };

  const formatETA = (etaStr: string | null) => {
    if (!etaStr) return "Not Scheduled";
    try {
      const date = new Date(etaStr);
      const jktDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const day = jktDate.getDate();
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const month = months[jktDate.getMonth()];
      const year = jktDate.getFullYear();
      const hour = String(jktDate.getHours()).padStart(2, "0");
      const minute = String(jktDate.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${year}, ${hour}:${minute} WIB`;
    } catch (e) {
      return etaStr;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-sm font-medium tracking-wide text-zinc-400">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(255,255,255,0))]" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {/* Logo Area */}
          <div className="relative mb-8 h-20 w-48">
            <Image
              src="/logojjsmanage.png"
              alt="JJS Manage Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Main Maintenance Card */}
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-md">
            {/* Header Icon */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Wrench className="h-7 w-7 animate-pulse" />
            </div>

            <h1 className="mb-3 text-2xl font-bold tracking-tight text-white">
              System Under Maintenance
            </h1>
            
            <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
              {info?.message || "Kami sedang melakukan peningkatan sistem untuk pengalaman yang lebih baik."}
            </p>

            {/* Meta Information Grid */}
            <div className="mb-6 space-y-3 border-y border-zinc-800/80 py-4 text-left text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-500">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  Estimated Finish
                </span>
                <span className="font-semibold text-emerald-400">
                  {formatETA(info?.estimatedFinish || null)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-500">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  Current Time
                </span>
                <span className="font-mono text-zinc-300">
                  {formatServerTime(serverTime)}
                </span>
              </div>
            </div>

            {/* Actions & Refresh */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700 active:scale-98 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Check Status Now
              </button>
              
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Auto refreshing in <span className="font-semibold text-zinc-400">{secondsToRefresh}s</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <p className="mt-8 text-xs text-zinc-600">
            JJS Manage v2.9.0 &copy; {new Date().getFullYear()} Sukabumi
          </p>
        </div>
      </div>
    </div>
  );
}
