import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MARKERS = ["admin", "hod", "faculty", "exam_officer", "dean"];

// GET ?courseCode=CSE301&date=2025-01-22  → existing marks for that session
// GET ?courseCode=CSE301                  → all records for the course (for reports)
export async function GET(req: NextRequest) {
  const sess = getSession(req);
  if (!sess || sess.role === "student") return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    const sp = req.nextUrl.searchParams;
    const courseCode = sp.get("courseCode") || undefined;
    const date = sp.get("date") || undefined;
    const records = await prisma.attendanceRecord.findMany({
      where: { ...(courseCode ? { courseCode } : {}), ...(date ? { date } : {}) },
      orderBy: { date: "asc" },
    });
    return NextResponse.json({ records });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST { courseCode, courseName, date, markedBy, entries:[{studentId,studentName,status}] }
export async function POST(req: NextRequest) {
  const sess = getSession(req);
  if (!sess || !MARKERS.includes(sess.role)) return NextResponse.json({ error: "Not authorized to mark attendance" }, { status: 403 });
  try {
    const b = await req.json();
    b._actor = sess.email; b._role = sess.role;
    if (!b.courseCode || !b.date || !Array.isArray(b.entries)) {
      return NextResponse.json({ error: "courseCode, date and entries required" }, { status: 400 });
    }
    const now = new Date().toISOString();
    let saved = 0;
    for (const e of b.entries) {
      if (!e.studentId || !e.status) continue;
      await prisma.attendanceRecord.upsert({
        where: { studentId_courseCode_date: { studentId: e.studentId, courseCode: b.courseCode, date: b.date } },
        update: { status: e.status, markedBy: b.markedBy || "Faculty" },
        create: {
          studentId: e.studentId, studentName: e.studentName || "",
          courseCode: b.courseCode, courseName: b.courseName || b.courseCode,
          date: b.date, status: e.status, markedBy: b.markedBy || "Faculty", createdAt: now,
        },
      });
      saved++;
    }
    await audit({ actor: b._actor, role: b._role, action: "Attendance marked", module: "Attendance", detail: `${b.courseCode} · ${b.date} · ${saved} students` });
    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
