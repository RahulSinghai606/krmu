import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Resolve the signed-in person from their SESSION (never a query param) → bundle their own data.
export async function GET(req: NextRequest) {
  try {
    const sess = getSession(req);
    if (!sess) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const email = sess.email;

    const student = await prisma.student.findFirst({ where: { email } });
    if (student) {
      const [results, attRecs, fees, registration] = await Promise.all([
        prisma.examResult.findMany({ where: { studentId: student.id } }),
        prisma.attendanceRecord.findMany({ where: { studentId: student.id } }),
        prisma.feeRecord.findMany({ where: { studentId: student.id } }),
        prisma.registration.findFirst({ where: { studentId: student.id }, orderBy: { submittedDate: "desc" } }),
      ]);

      // Attendance per course
      const byCourse: Record<string, { name: string; p: number; t: number }> = {};
      attRecs.forEach(r => { const e = byCourse[r.courseCode] ||= { name: r.courseName, p: 0, t: 0 }; e.t++; if (r.status === "present") e.p++; });
      const attendance = Object.entries(byCourse).map(([code, v]) => ({ code, name: v.name, pct: Math.round((v.p / v.t) * 100), attended: v.p, total: v.t }));
      const overallAtt = attendance.length ? Math.round(attendance.reduce((s, a) => s + a.pct, 0) / attendance.length) : student.attendance;

      const totalDue = fees.reduce((s, f) => s + f.due, 0);
      const weakest = [...results].sort((a, b) => a.total - b.total)[0] || null;

      return NextResponse.json({
        kind: "student",
        student,
        results: results.sort((a, b) => a.courseCode.localeCompare(b.courseCode)),
        attendance, overallAtt, totalDue, registration, weakest,
      });
    }

    const faculty = await prisma.faculty.findFirst({ where: { email } });
    if (faculty) {
      const courses = await prisma.course.findMany({ where: { faculty: faculty.name } });
      const myResults = await prisma.examResult.findMany({ where: { courseCode: { in: courses.map(c => c.code) } } });
      const drafts = myResults.filter(r => r.status === "draft").length;
      return NextResponse.json({ kind: "faculty", faculty, courses, resultCount: myResults.length, draftResults: drafts });
    }

    return NextResponse.json({ kind: "staff" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
