"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, User, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-[#020617] p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse duration-[10s]" />
        <div className="absolute top-[20%] -right-[5%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse duration-[8s] delay-700" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[110px] animate-pulse duration-[12s] delay-1000" />

        {/* Fine Grain Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-8 duration-1000 ease-out">
          <div className="relative inline-flex mb-0 group">
            <div className="absolute inset-8 bg-linear-to-tr from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="relative inline-flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 overflow-hidden">
              <Image
                src="/logojjsmanage.png"
                alt="JJS Manage Logo"
                fill
                sizes="(max-width: 768px) 128px, 160px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-2">
            Jjs<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Manage</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium opacity-80">
            Sistem Konsinyasi Digital
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="w-full border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 fade-in duration-700">
          <CardHeader className="space-y-1 pt-8 pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center text-white">Selamat Datang</CardTitle>
            <CardDescription className="text-center text-slate-400 text-xs sm:text-sm">
              Masukkan akun Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-8">
            <form action={formAction} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 text-xs font-semibold ml-1 uppercase tracking-wider">Username</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="Username Anda"
                    className="pl-11 h-12 sm:h-14 bg-white/5 border-white/5 focus:border-blue-500/40 focus:ring-0 rounded-2xl transition-all placeholder:text-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</Label>
                </div>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-11 pr-12 h-12 sm:h-14 bg-white/5 border-white/5 focus:border-purple-500/40 focus:ring-0 rounded-2xl transition-all placeholder:text-slate-600 text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] sm:text-xs font-medium animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {state.error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 sm:h-14 bg-linear-to-r from-blue-600 to-purple-600 hover:scale-[1.02] active:scale-[0.98] text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-blue-600/20"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <span>Masuk Sekarang</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="mt-8 text-slate-500 text-[10px] sm:text-xs font-medium tracking-widest uppercase opacity-60">
          &copy; {new Date().getFullYear()} JjsManage &bull; Powered by ndhvbase
        </p>
      </div>
    </div>
  );
}
