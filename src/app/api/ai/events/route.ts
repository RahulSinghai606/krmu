import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// §6.3.6 Observability feed — recent AI activity + rollups. Admin/registrar only.
export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s || !["admin", "registrar"].includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    const events = await prisma.aiEvent.findMany({ orderBy: { at: "desc" }, take: 100 });
    const total = events.length;
    const stats = {
      total,
      tokensIn: events.reduce((s, e) => s + e.tokensIn, 0),
      tokensOut: events.reduce((s, e) => s + e.tokensOut, 0),
      avgLatency: total ? Math.round(events.reduce((s, e) => s + e.latencyMs, 0) / total) : 0,
      grounded: events.filter(e => e.grounded).length,
      refused: events.filter(e => e.refused).length,
      // ~ Azure GPT-5.4 indicative blended rate: $4/1M in, $12/1M out
      estCostUsd: +(events.reduce((s, e) => s + (e.tokensIn * 4 + e.tokensOut * 12) / 1_000_000, 0)).toFixed(4),
    };
    return NextResponse.json({ events: events.slice(0, 40), stats });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
