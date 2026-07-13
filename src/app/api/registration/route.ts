import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { STUDENTS } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPROVERS = ["admin", "registrar", "dean", "hod"];

// Resolve the authenticated student's record id from their session (by enrollmentNo).
function ownStudentId(studentIdClaim?: string) {
  return STUDENTS.find(s => s.enrollmentNo === studentIdClaim)?.id;
}

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    let where = {};
    if (s.role === "student") {
      // Students only ever see their own — server-enforced, regardless of query params.
      where = { studentId: ownStudentId(s.studentId) || "__none__" };
    } else if (!APPROVERS.includes(s.role)) {
      return NextResponse.json({ error: "Not authorized to view the registration queue" }, { status: 403 });
    }
    const regs = await prisma.registration.findMany({ where, orderBy: { submittedDate: "desc" } });
    return NextResponse.json({ registrations: regs });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST submit/re-submit registration
export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s || s.role !== "student") return NextResponse.json({ error: "Only a student can submit their own registration" }, { status: 403 });
  try {
    const b = await req.json();
    // Ownership is server-enforced: a student can only register THEMSELF (ignore body studentId).
    const sid = ownStudentId(s.studentId);
    const me = STUDENTS.find(x => x.id === sid);
    if (!me) return NextResponse.json({ error: "No student record for this account" }, { status: 400 });
    b.studentId = me.id; b.studentName = me.name; b.programme = me.programme; b.semester = me.semester;
    if (!Array.isArray(b.courses) || !b.courses.length) {
      return NextResponse.json({ error: "at least one course required" }, { status: 400 });
    }
    if (b.credits < 18 || b.credits > 26) {
      return NextResponse.json({ error: "Credit load must be between 18 and 26" }, { status: 400 });
    }
    const reg = await prisma.registration.upsert({
      where: { studentId_semester: { studentId: b.studentId, semester: Number(b.semester) } },
      update: { courses: JSON.stringify(b.courses), credits: Number(b.credits), status: "submitted", submittedDate: new Date().toISOString().slice(0, 10), approvedBy: null, remark: null },
      create: {
        studentId: b.studentId, studentName: b.studentName || "", programme: b.programme || "",
        semester: Number(b.semester), courses: JSON.stringify(b.courses), credits: Number(b.credits),
        status: "submitted", submittedDate: new Date().toISOString().slice(0, 10),
      },
    });
    await audit({ actor: b._actor, role: b._role, action: "Registration submitted", module: "Registration", detail: `${b.studentName} · Sem ${b.semester} · ${b.courses.length} courses` });
    return NextResponse.json({ registration: reg });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
