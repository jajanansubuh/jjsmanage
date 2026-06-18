"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, User, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = () => {
    toast.info("Silakan hubungi Administrator untuk mengatur ulang password Anda.");
  };

  const handleRegister = () => {
    toast.info("Pembuatan akun suplier atau kasir dikelola langsung oleh Administrator.");
  };

  return (
    <div className="h-[100vh] w-screen flex bg-[#0c0e12] text-white font-sans overflow-hidden relative select-none">
      {/* Subtle Premium Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse duration-[10s]" />
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[110px] animate-pulse duration-[12s] delay-1000" />
      </div>

      {/* Main Split-Screen Container */}
      <div className="flex w-full h-full relative z-10">
        
        {/* Left Side: Login Form */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-16 xl:px-24 py-8 overflow-y-auto">
          
          <div className="max-w-md w-full mx-auto space-y-8">
            {/* Branding Logo */}
            <div className="flex flex-col items-start gap-4">
              <div className="relative w-20 h-20 overflow-hidden">
                <Image
                  src="/logojjsmanage.png"
                  alt="JJS Manage Logo"
                  fill
                  sizes="80px"
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                  Jjs<span className="text-emerald-400">Manage</span>
                </h1>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-emerald-500/70">
                  Sistem Konsinyasi Digital
                </p>
              </div>
            </div>

            {/* Header Titles */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Masuk untuk mengelola produk dan konsinyasi Anda
              </p>
            </div>

            {/* Mobile Hero Card (shown only on mobile/tablet) */}
            <div className="block lg:hidden relative w-full h-44 sm:h-52 rounded-[20px] rounded-tr-[60px] rounded-bl-[60px] overflow-hidden border border-white/5 bg-slate-900/50 shadow-md">
              <Image
                src="/login_hero.png"
                alt="Consignment Snacks Illustration"
                fill
                sizes="(max-width: 1024px) 100vw, 1px"
                className="object-cover pointer-events-none select-none"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/60 pointer-events-none" />
              <div className="absolute top-6 right-6 left-6 text-right z-10 select-none">
                <p className="text-slate-200 font-normal text-sm sm:text-lg leading-relaxed tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                  Kelola titipan barang &amp; bagi hasil konsinyasi{" "}
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-[0_1px_8px_rgba(52,211,153,0.3)]">
                    jajanan subuh
                  </span>{" "}
                  secara <span className="font-bold text-white">otomatis</span> &amp; <span className="font-bold text-white">transparan</span>.
                </p>
              </div>
            </div>

            {/* Credentials Login Form */}
            <form action={formAction} className="space-y-4">
              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Username
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="Username Anda"
                    className="pl-11 h-12 bg-white/3 border-white/5 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 rounded-xl transition-all placeholder:text-slate-600 text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Password
                  </Label>
                </div>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-11 pr-12 h-12 bg-white/3 border-white/5 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 rounded-xl transition-all placeholder:text-slate-600 text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between px-1 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-300 cursor-pointer select-none">
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded-md border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 focus:ring-2 transition-all cursor-pointer accent-emerald-500"
                  />
                  <span>Ingat saya</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Lupa Password?
                </button>
              </div>

              {/* Error Alert */}
              {state?.error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {state.error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] border-none"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <span>Masuk Sekarang</span>
                )}
              </Button>
            </form>

            {/* Register Footer Link */}
            <div className="text-center pt-2">
              <p className="text-xs font-medium text-slate-500">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={handleRegister}
                  className="font-bold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Hubungi Admin
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Hero Image Card */}
        <div className="hidden lg:flex w-[55%] p-6 items-center justify-center h-full">
          <div className="relative w-full h-full rounded-[40px] rounded-tr-[120px] rounded-bl-[120px] overflow-hidden group shadow-2xl border border-white/5 bg-slate-900/50">
            {/* Background Image */}
            <Image
              src="/login_hero.png"
              alt="Consignment Snacks Illustration"
              fill
              sizes="(max-width: 1024px) 1px, 100vw"
              className="object-cover group-hover:scale-102 transition-transform duration-[4000ms] ease-out select-none pointer-events-none"
              priority
              unoptimized
            />
            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/60 pointer-events-none" />
            
            {/* Overlay Tagline Text */}
            <div className="absolute top-12 right-12 left-12 text-right max-w-md lg:max-w-lg ml-auto z-10 select-none">
              <p className="text-slate-200 font-normal text-2xl lg:text-3xl leading-relaxed tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
                Kelola titipan barang &amp; bagi hasil konsinyasi{" "}
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-[0_2px_10px_rgba(52,211,153,0.3)]">
                  jajanan subuh
                </span>{" "}
                secara <span className="font-extrabold text-white">otomatis</span> &amp; <span className="font-extrabold text-white">transparan</span>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
