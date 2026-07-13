import { NextRequest, NextResponse } from "next/server";

// Site-wide access gate — blocks scrapers/public until the shared password is entered.
const GATE_TOKEN = "krmu-kellton-2026";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // The gate protects page CONTENT from scrapers. API routes are guarded by their own
  // session auth, and internal server-to-server calls (e.g. the eval harness) don't carry
  // the gate cookie — so let all /api through here.
  if (pathname.startsWith("/api")) return NextResponse.next();
  // Always allow the gate page + the public document-verification page.
  if (pathname.startsWith("/gate") || pathname.startsWith("/verify")) return NextResponse.next();

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
