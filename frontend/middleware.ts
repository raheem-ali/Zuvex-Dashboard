import { NextResponse, type NextRequest } from "next/server";

// Quick gate: no cookie -> go to /login.
// The dashboard layout does the real check against Laravel.
export function middleware(req: NextRequest) {
  if (!req.cookies.get("admin_token")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};