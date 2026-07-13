import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
const APPROVERS = ["admin", "registrar", "dean", "hod"];

const TRANSITIONS: Record<string, string[]> = {
  submitted: ["advisor_approved", "rejected"],
  advisor_approved: ["confirmed", "rejected"],
  rejected: ["submitted"],
  confirmed: [],
};

// PATCH { action: "approve" | "confirm" | "reject", by, remark }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sess = getSession(req);
  if (!sess || !APPROVERS.includes(sess.role)) {
    return NextResponse.json({ error: "Only registrar/dean/HOD can decide registrations" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const b = await req.json();
    b.by = sess.name; b._role = sess.role; // authoritative, from session
    const reg = await prisma.registration.findUnique({ where: { id } });
    if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const target = b.action === "approve" ? "advisor_approved" : b.action === "confirm" ? "confirmed" : b.action === "reject" ? "rejected" : null;
    if (!target) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    if (!TRANSITIONS[reg.status]?.includes(target)) {
      return NextResponse.json({ error: `Cannot ${b.action} a registration that is "${reg.status}"` }, { status: 409 });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: target, approvedBy: b.by || "Approver", remark: b.remark || null },
    });
    await audit({ actor: b._actor, role: b._role, action: `Registration ${b.action}d`, module: "Registration", detail: `${reg.studentName} · Sem ${reg.semester}` });
    return NextResponse.json({ registration: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
