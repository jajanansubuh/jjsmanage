"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, User, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-700" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-indigo-600/15 rounded-full blur-[110px] animate-pulse delay-1000" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.826 10.558c1.026 1.312 1.146 3.126.31 4.56L44.826 31.812c-.836 1.434-2.39 2.29-4.04 2.29H19.214c-1.65 0-3.204-.856-4.04-2.29L4.864 15.118c-.836-1.434-.716-3.248.31-4.56L10.51 3.558C11.346 2.124 12.9 1.268 14.55 1.268h30.9c1.65 0 3.204.856 4.04 2.29l5.336 7z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-1000 ease-out">
          <div className="relative inline-flex mb-6 group">
            <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-tr from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-10 h-10 text-white animate-in zoom-in duration-700 delay-300" />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-3 drop-shadow-sm">
            Jjs<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Manage</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-wide">
            Masuk ke panel manajemen konsinyasi
          </p>
        </div>

        <Card className="border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-700">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center bg-linear-to-b from-white to-slate-400 bg-clip-text text-transparent">Login</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Silakan masukkan kredensial Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-slate-300 font-medium ml-1">Username</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-blue-400 text-slate-500">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Masukkan username"
                    className="pl-11 h-12 bg-slate-950/40 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-slate-300 font-medium">Password</Label>
                  <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Lupa Password?</button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-purple-400 text-slate-500">
                    <KeyRound className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-11 pr-11 h-12 bg-slate-950/40 border-white/5 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300 placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-300 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  {state.error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 relative overflow-hidden group bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] active:scale-[0.98] disabled:opacity-70"
                disabled={isPending}
              >
                <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memverifikasi...</span>
                  </div>
                ) : (
                  <span>Masuk ke Dashboard</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-10 text-center space-y-4">
          <p className="text-slate-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} <span className="text-slate-400">ndhvbase</span>. Semua hak dilindungi.
          </p>
          <div className="flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {/* You can add partner logos here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
