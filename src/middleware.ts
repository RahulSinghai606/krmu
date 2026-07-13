import { NextRequest, NextResponse } from "next/server";

// Site-wide access gate — blocks scrapers/public until the shared password is entered.
const GATE_TOKEN = "krmu-kellton-2026";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Always allow the gate page + its verify endpoint.
  if (pathname.startsWith("/gate") || pathname.startsWith("/api/gate")) return NextResponse.next();

  if (req.cookies.get("krmu_gate")?.value === GATE_TOKEN) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
  return NextResponse.redirect(url);
}

// Run on everything except Next internals and public assets.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.ico).*)"],
};
