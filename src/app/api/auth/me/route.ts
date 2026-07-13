import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { DEMO_USERS } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Restore identity from the verified cookie (used on app load instead of localStorage).
export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ user: null });
  return NextResponse.json({ user: DEMO_USERS[s.role] || null });
}
