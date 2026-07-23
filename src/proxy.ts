import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth-utils";

// List of public routes that don't require authentication
const publicRoutes = ["/login"];

interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  estimatedFinish: string | null;
}

let edgeCachedStatus: MaintenanceStatus | null = null;
let edgeCacheExpiresAt = 0;
const CACHE_DURATION_MS = 5000; // 5 seconds in-memory Edge cache

async function fetchMaintenanceStatus(requestUrl: string): Promise<MaintenanceStatus> {
  const now = Date.now();
  if (edgeCachedStatus && edgeCacheExpiresAt > now) {
    return edgeCachedStatus;
  }

  try {
    const url = new URL("/api/maintenance/status", requestUrl);
    const res = await fetch(url.toString(), {
      cache: "no-store", // disable CDN caching to ensure real-time toggle
    });

    if (res.ok) {
      const data = (await res.json()) as MaintenanceStatus;
      edgeCachedStatus = data;
      edgeCacheExpiresAt = Date.now() + CACHE_DURATION_MS;
      return data;
    }
  } catch (err) {
    console.error("Middleware failed to fetch maintenance status:", err);
  }

  // Safe fallback if the status API fails or db is down
  return {
    enabled: false,
    message: "System is under maintenance.",
    estimatedFinish: null,
  };
}

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Standard static assets and system endpoint bypasses
  const isBypass =
    path === "/maintenance" ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/manifest.json" ||
    path === "/site.webmanifest" ||
    path === "/sw.js" ||
    path.startsWith("/api/telegram/webhook") ||
    path.startsWith("/api/maintenance/status") ||
    path.startsWith("/_next") ||
    /\.(?:png|jpg|jpeg|gif|svg|ico|webp|json|webmanifest|js|css|map)$/.test(path);

  if (isBypass) {
    return NextResponse.next();
  }

  const maintenance = await fetchMaintenanceStatus(req.url);

  if (maintenance.enabled) {
    const cookie = req.cookies.get("session")?.value;
    const session = cookie ? await decrypt(cookie).catch(() => null) : null;
    const isAdmin = session?.user?.role?.toUpperCase() === "ADMIN";

    if (!isAdmin) {
      if (path.startsWith("/api")) {
        return NextResponse.json(
          {
            success: false,
            message: maintenance.message || "System is under maintenance.",
          },
          { status: 503 }
        );
      }
      return NextResponse.redirect(new URL("/maintenance", req.nextUrl));
    }
  }

  const isPublicRoute = publicRoutes.includes(path);

  // Get session from cookies
  const cookie = req.cookies.get("session")?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  // Redirect to /login if the user is not authenticated and trying to access a protected route
  if (!isPublicRoute && !session) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect to / if the user is authenticated and trying to access /login
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Supplier Role Based Access Control
  if (session?.user?.role?.toUpperCase() === "SUPPLIER") {
    const allowedPaths = ['/deposits', '/settings', '/payouts', '/savings', '/produk', '/cetak', '/potongan'];

    // Protect UI routes
    if (path === '/' || (!allowedPaths.includes(path) && !path.startsWith('/api'))) {
      return NextResponse.redirect(new URL('/deposits', req.nextUrl));
    }

    // Protect API routes
    if (path.startsWith('/api')) {
      const allowedApiPaths = ['/api/reports', '/api/users/profile', '/api/auth', '/api/savings', '/api/stats', '/api/print-queue', '/api/products', '/api/deductions'];
      const isAllowedApi = allowedApiPaths.some(p => path.startsWith(p));
      if (!isAllowedApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|json|webmanifest|js|css|map)).*)",
  ],
};
