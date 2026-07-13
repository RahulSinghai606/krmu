import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
const STAFF = ["admin", "registrar", "dean", "hod", "finance", "hostel_warden", "exam_officer"];

// Staff resolve a grievance or add a comment.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    const { id } = await params;
    const b = await req.json();
    const g = await prisma.grievance.findUnique({ where: { id } });
    if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (b.comment) {
      const comments = JSON.parse(g.comments || "[]");
      comments.push(b.comment);
      data.comments = JSON.stringify(comments);
      data.status = g.status === "open" ? "in-progress" : g.status;
    }
    if (b.action === "resolve") { data.status = "resolved"; data.resolvedDate = new Date().toISOString().slice(0, 10); }
    const updated = await prisma.grievance.update({ where: { id }, data });
    await audit({ actor: s.email, role: s.role, action: b.action === "resolve" ? "Grievance resolved" : "Grievance updated", module: "Grievance", detail: `${g.ticketNo} — ${g.subject}` });
    return NextResponse.json({ grievance: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
