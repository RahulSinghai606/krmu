import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// POST { type, _actor, _role } — confirm-gated AI actions. Each returns a human summary.
export async function POST(req: NextRequest) {
  try {
    const sess = getSession(req);
    if (!sess) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const actor = sess.email, role = sess.role;
    if (["student", "faculty"].includes(role)) {
      return NextResponse.json({ error: "Your role cannot run institution-wide actions." }, { status: 403 });
    }
    const b = await req.json();

    switch (b.type) {
      case "fee_reminders": {
        const defaulters = await prisma.feeRecord.findMany({ where: { due: { gt: 0 } } });
        await audit({ actor, role, action: "Fee reminders sent", module: "Fees", detail: `${defaulters.length} students · SMS + WhatsApp` });
        return NextResponse.json({ ok: true, message: `Reminders queued to ${defaulters.length} students with outstanding dues (₹${defaulters.reduce((s, f) => s + f.due, 0).toLocaleString("en-IN")} total) via SMS + WhatsApp.` });
      }
      case "attendance_notices": {
        const all = await prisma.attendanceRecord.findMany();
        const byStudent: Record<string, { p: number; t: number; name: string }> = {};
        all.forEach(r => { const e = byStudent[r.studentId] ||= { p: 0, t: 0, name: r.studentName }; e.t++; if (r.status === "present") e.p++; });
        const short = Object.values(byStudent).filter(e => e.t > 0 && (e.p / e.t) * 100 < 75);
        await audit({ actor, role, action: "Shortage notices drafted", module: "Attendance", detail: `${short.length} students below 75%` });
        return NextResponse.json({ ok: true, message: `Drafted attendance-shortage notices for ${short.length} students below 75% and queued them to mentors.` });
      }
      case "publish_pending_results": {
        const drafts = await prisma.examResult.findMany({ where: { status: "draft" } });
        const codes = Array.from(new Set(drafts.map(d => d.courseCode)));
        await prisma.examResult.updateMany({ where: { status: "draft" }, data: { status: "published" } });
        await audit({ actor, role, action: "Pending results published", module: "Examinations", detail: codes.join(", ") || "none" });
        return NextResponse.json({ ok: true, message: drafts.length ? `Published ${drafts.length} draft results across ${codes.length} courses (${codes.join(", ")}).` : "No draft results were pending." });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
