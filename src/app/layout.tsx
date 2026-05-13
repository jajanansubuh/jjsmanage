import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
// poppins font

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "JjsManage - Solusi Manajemen Konsinyasi",
  description: "Aplikasi manajemen bagi hasil konsinyasi yang modern dan efisien.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JJS Manage",
  },
  icons: {
    icon: "/logojjsmanage.png",
    apple: "/logojjsmanage.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background font-sans">
        {children}
        <Toaster position="top-right" richColors />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
