import { NextRequest, NextResponse } from "next/server";
import { sessionForRole, SESSION_COOKIE } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

export const runtime = "nodejs";

// Demo login: pick a role → server issues a signed HTTP-only session cookie.
// (Replace with credential/SSO verification in production; the cookie mechanism stays.)
export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();
    const sess = sessionForRole(role as UserRole);
    if (!sess) return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    const res = NextResponse.json({ user: sess.user });
    res.cookies.set(SESSION_COOKIE, sess.token, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8, // 8h
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
