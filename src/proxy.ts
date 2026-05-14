import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth-utils";

// List of public routes that don't require authentication
const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // Get session from cookies
  const cookie = req.cookies.get("session")?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  // Redirect to /login if the user is not authenticated and trying to access a protected route
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect to / if the user is authenticated and trying to access /login
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Supplier Role Based Access Control
  if (session?.user?.role?.toUpperCase() === "SUPPLIER") {
    const allowedPaths = ['/deposits', '/settings', '/payouts', '/savings', '/produk', '/cetak'];

    // Protect UI routes
    if (path === '/' || (!allowedPaths.includes(path) && !path.startsWith('/api'))) {
      return NextResponse.redirect(new URL('/deposits', req.nextUrl));
    }

    // Protect API routes
    if (path.startsWith('/api')) {
      const allowedApiPaths = ['/api/reports', '/api/users/profile', '/api/auth', '/api/savings', '/api/stats', '/api/print-queue', '/api/products'];
      const isAllowedApi = allowedApiPaths.some(p => path.startsWith(p));
      if (!isAllowedApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
