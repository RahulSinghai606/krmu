import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { COURSES } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const GRADERS = ["admin", "exam_officer", "hod", "faculty", "dean"];

const gradeOf = (t: number) => t >= 90 ? "O" : t >= 80 ? "A+" : t >= 70 ? "A" : t >= 60 ? "B+" : t >= 50 ? "B" : t >= 45 ? "C" : "F";

// GET ?courseCode=CSE301  → results for a course;  GET ?studentId=s001 → a student's transcript
export async function GET(req: NextRequest) {
  const sess = getSession(req);
  if (!sess || sess.role === "student") return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    const sp = req.nextUrl.searchParams;
    const courseCode = sp.get("courseCode") || undefined;
    const studentId = sp.get("studentId") || undefined;
    const results = await prisma.examResult.findMany({
      where: { ...(courseCode ? { courseCode } : {}), ...(studentId ? { studentId } : {}) },
      orderBy: { courseCode: "asc" },
    });
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST { courseCode, courseName, semester, status?, entries:[{studentId,studentName,internal,external}] }
export async function POST(req: NextRequest) {
  try {
    const sess = getSession(req);
    if (!sess || !GRADERS.includes(sess.role)) return NextResponse.json({ error: "Not authorized to enter marks" }, { status: 403 });
    const b = await req.json();
    b.updatedBy = sess.name; b._actor = sess.email; b._role = sess.role;
    if (!b.courseCode || !Array.isArray(b.entries)) {
      return NextResponse.json({ error: "courseCode and entries required" }, { status: 400 });
    }
    // Faculty may only grade courses they teach.
    if (sess.role === "faculty") {
      const owns = COURSES.some(c => c.code === b.courseCode && c.faculty === sess.name);
      if (!owns) return NextResponse.json({ error: "You can only enter marks for your own courses" }, { status: 403 });
    }
    const now = new Date().toISOString();
    const status = b.status === "published" ? "published" : "draft";
    let saved = 0;
    for (const e of b.entries) {
      if (!e.studentId) continue;
      const internal = Math.max(0, Math.min(30, Number(e.internal) || 0));
      const external = Math.max(0, Math.min(70, Number(e.external) || 0));
      const total = internal + external;
      await prisma.examResult.upsert({
        where: { studentId_courseCode: { studentId: e.studentId, courseCode: b.courseCode } },
        update: { internal, external, total, grade: gradeOf(total), status, updatedBy: b.updatedBy || "Exam Officer", updatedAt: now },
        create: {
          studentId: e.studentId, studentName: e.studentName || "", courseCode: b.courseCode,
          courseName: b.courseName || b.courseCode, semester: Number(b.semester) || 0,
          internal, external, total, grade: gradeOf(total), status, updatedBy: b.updatedBy || "Exam Officer", updatedAt: now,
        },
      });
      saved++;
    }
    await audit({ actor: b._actor, role: b._role, action: status === "published" ? "Results published" : "Marks saved", module: "Examinations", detail: `${b.courseCode} · ${saved} students` });
    return NextResponse.json({ ok: true, saved, status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
