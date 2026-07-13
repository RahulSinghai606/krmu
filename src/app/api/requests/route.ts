import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const STAFF = ["admin", "registrar", "dean", "hod", "finance", "hostel_warden", "exam_officer"];

// Aggregated queue of OPEN student requests across modules — for the staff "you have N requests" nudge + AI.
export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    const [grievances, regs, certs] = await Promise.all([
      prisma.grievance.findMany({ where: { status: { in: ["open", "in-progress"] } }, orderBy: { raisedDate: "desc" } }),
      prisma.registration.findMany({ where: { status: { in: ["submitted", "advisor_approved"] } } }),
      prisma.certificateRequest.findMany({ where: { status: "processing" } }),
    ]);
    const items = [
      ...grievances.map(g => ({ kind: "Grievance", who: g.studentName, what: g.subject, ref: g.ticketNo, priority: g.priority })),
      ...regs.map(r => ({ kind: "Registration", who: r.studentName, what: `Sem ${r.semester} registration`, ref: r.id.slice(-6), priority: "medium" })),
      ...certs.map(c => ({ kind: "Certificate", who: c.studentName, what: c.type, ref: c.id.toUpperCase(), priority: "medium" })),
    ];
    return NextResponse.json({
      counts: { grievances: grievances.length, registrations: regs.length, certificates: certs.length, total: items.length },
      items,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
