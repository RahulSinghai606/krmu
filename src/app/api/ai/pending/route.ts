import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const APPROVERS = ["admin", "registrar", "dean", "hod", "finance", "exam_officer"];

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s || !APPROVERS.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    const actions = await prisma.pendingAction.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ actions });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
