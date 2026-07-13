import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PASSWORD = "kelltonisbest";
const GATE_TOKEN = "krmu-kellton-2026";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (password !== PASSWORD) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("krmu_gate", GATE_TOKEN, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
