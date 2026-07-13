import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { UPCOMING_EXAMS, STUDENTS } from "@/lib/data";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Student self-service: eligibility-gated hall ticket data (exam schedule + verification code).
export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s || s.role !== "student") return NextResponse.json({ error: "Students only" }, { status: 403 });
  const meta = STUDENTS.find(x => x.email === s.email || x.enrollmentNo === s.studentId);
  const me = meta ? await prisma.student.findUnique({ where: { id: meta.id } }) : null;
  if (!me) return NextResponse.json({ error: "No student record" }, { status: 404 });

  const reg = await prisma.registration.findFirst({ where: { studentId: me.id } });
  const blockers: string[] = [];
  if (me.attendance < 75) blockers.push(`attendance ${me.attendance}% (below 75%)`);
  if (me.feeDue > 0) blockers.push(`pending fees ₹${me.feeDue.toLocaleString("en-IN")}`);
  if (reg?.status === "rejected") blockers.push("registration rejected");
  if (blockers.length) return NextResponse.json({ eligible: false, blockers });

  const exams = UPCOMING_EXAMS.filter(e => e.programme === me.programme || e.programme.includes("All"))
    .map(e => ({ code: e.code, subject: e.subject, date: e.date, time: e.time, venue: e.room }));
  const code = crypto.createHash("sha256").update(`${me.enrollmentNo}|HT|KRMU-EXAMS`).digest("hex").slice(0, 12).toUpperCase();
  await audit({ actor: s.email, role: s.role, action: "Hall ticket downloaded", module: "Examinations", detail: `${me.name} · ${code}` });
  return NextResponse.json({
    eligible: true,
    ticket: { name: me.name, enrollmentNo: me.enrollmentNo, programme: me.programme, semester: me.semester, section: me.section, photoInitials: me.name.split(" ").map(w => w[0]).join("").slice(0, 2), code, session: "End Semester Examination · 2026", exams },
  });
}

// Staff: release hall tickets — notifies all eligible students.
export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s || !["admin", "registrar", "exam_officer"].includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const [students, dueFees] = await Promise.all([prisma.student.findMany(), prisma.feeRecord.findMany({ where: { due: { gt: 0 } } })]);
  const due = new Set(dueFees.map(f => f.studentId));
  const eligible = students.filter(x => x.attendance >= 75 && !due.has(x.id));
  await prisma.notification.create({
    data: {
      id: `n-${Date.now()}`, title: "Hall tickets released", type: "info",
      message: `Hall tickets for the End Semester Examination are now available. ${eligible.length} eligible students can download them from My Results.`,
      target: "students", channels: JSON.stringify(["email", "app"]), sentAt: new Date().toISOString(), sentBy: s.email, readCount: 0, totalRecipients: eligible.length,
    },
  });
  await audit({ actor: s.email, role: s.role, action: "Hall tickets released", module: "Examinations", detail: `${eligible.length} eligible students notified` });
  return NextResponse.json({ ok: true, eligible: eligible.length });
}
