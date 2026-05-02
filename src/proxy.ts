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

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
