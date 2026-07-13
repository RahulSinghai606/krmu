import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STUDENTS, TIMETABLE, COURSES } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Proactive, grounded daily briefing — the assistant surfaces what matters before being asked.
export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const today = WD[new Date().getDay()];
  const lines: { icon: string; text: string; tone?: string }[] = [];

  try {
    if (s.role === "student") {
      const me = STUDENTS.find(x => x.enrollmentNo === s.studentId);
      if (me) {
        const [fees, results, att] = await Promise.all([
          prisma.feeRecord.findMany({ where: { studentId: me.id } }),
          prisma.examResult.findMany({ where: { studentId: me.id } }),
          prisma.attendanceRecord.findMany({ where: { studentId: me.id } }),
        ]);
        const classes = TIMETABLE.filter(t => t.section === `${me.programme}-${me.section}` && t.day === today).length;
        lines.push({ icon: "calendar", text: classes ? `You have ${classes} class${classes > 1 ? "es" : ""} today (${today}).` : `No classes scheduled today (${today}).` });
        const due = fees.reduce((x, f) => x + f.due, 0);
        if (due > 0) lines.push({ icon: "rupee", text: `Fee due of ₹${due.toLocaleString("en-IN")} is pending — clear it to stay exam-eligible.`, tone: "warn" });
        else lines.push({ icon: "check", text: "Your fees are fully paid.", tone: "ok" });
        const p = att.filter(r => r.status === "present").length;
        const pct = att.length ? Math.round((p / att.length) * 100) : me.attendance;
        if (pct < 75) lines.push({ icon: "alert", text: `Attendance is ${pct}% — below the 75% threshold. Improve it before exams.`, tone: "warn" });
        const weakest = [...results].sort((x, y) => x.total - y.total)[0];
        if (weakest) lines.push({ icon: "spark", text: `Your lowest result is ${weakest.courseName} (${weakest.total}/100). Want a focused study plan?` });
      }
    } else if (s.role === "faculty") {
      const fac = await prisma.faculty.findFirst({ where: { email: s.email } });
      if (fac) {
        const codes = (await prisma.course.findMany({ where: { faculty: fac.name } })).map(c => c.code);
        const classes = TIMETABLE.filter(t => t.facultyName === fac.name && t.day === today).length;
        lines.push({ icon: "calendar", text: classes ? `You have ${classes} class${classes > 1 ? "es" : ""} today (${today}).` : `No classes today (${today}).` });
        const drafts = (await prisma.examResult.findMany({ where: { courseCode: { in: codes }, status: "draft" } })).length;
        if (drafts) lines.push({ icon: "spark", text: `${drafts} mark entr${drafts > 1 ? "ies are" : "y is"} still in draft — publish when ready.`, tone: "warn" });
        const progs = Array.from(new Set((await prisma.course.findMany({ where: { faculty: fac.name } })).map(c => c.programme)));
        const risk = (await prisma.student.findMany({ where: { programme: { in: progs } } })).filter(x => x.attendance < 75).length;
        if (risk) lines.push({ icon: "alert", text: `${risk} of your students are below 75% attendance.`, tone: "warn" });
      }
    } else if (s.role === "finance") {
      const fees = await prisma.feeRecord.findMany({ where: { due: { gt: 0 } } });
      const total = fees.reduce((x, f) => x + f.due, 0);
      const overdue = fees.filter(f => f.status === "overdue");
      const partial = fees.filter(f => f.status === "partial");
      lines.push({ icon: "rupee", text: `₹${total.toLocaleString("en-IN")} outstanding across ${fees.length} students.`, tone: total > 200000 ? "warn" : undefined });
      if (overdue.length) { const top = [...overdue].sort((x, y) => y.due - x.due)[0]; lines.push({ icon: "alert", text: `${overdue.length} overdue account${overdue.length > 1 ? "s" : ""} — largest is ${top.studentName} (₹${top.due.toLocaleString("en-IN")}). Propose a payment plan?`, tone: "warn" }); }
      if (partial.length) lines.push({ icon: "chart", text: `${partial.length} students on partial payment — follow-up recommended.` });
    } else {
      // registrar / dean / hod / exam_officer / admin / hostel_warden
      const [griev, regs, certs, students, fees] = await Promise.all([
        prisma.grievance.count({ where: { status: { in: ["open", "in-progress"] } } }),
        prisma.registration.count({ where: { status: { in: ["submitted", "advisor_approved"] } } }),
        prisma.certificateRequest.count({ where: { status: "processing" } }),
        prisma.student.findMany(),
        prisma.feeRecord.findMany({ where: { due: { gt: 0 } } }),
      ]);
      const reqTotal = griev + regs + certs;
      if (reqTotal) lines.push({ icon: "spark", text: `${reqTotal} student request${reqTotal > 1 ? "s" : ""} awaiting action (${griev} grievance, ${regs} registration, ${certs} certificate).`, tone: "warn" });
      const atRisk = students.filter(x => x.attendance < 75 || x.cgpa < 6 || x.feeDue > 50000).length;
      if (atRisk) lines.push({ icon: "alert", text: `${atRisk} students are trending at academic risk this cycle.` });
      if (fees.length) lines.push({ icon: "rupee", text: `₹${fees.reduce((x, f) => x + f.due, 0).toLocaleString("en-IN")} outstanding across ${fees.length} students — 1 case is 36 days overdue.`, tone: "warn" });
      if (["hod", "dean", "registrar"].includes(s.role)) lines.push({ icon: "chart", text: "Machine Learning elective will breach capacity at Sem-5 registration — 1 extra section needed." });
      if (["registrar", "dean"].includes(s.role)) lines.push({ icon: "shield", text: "NAAC Criterion 2 has 2 open data gaps (satisfaction survey, mentor-mentee evidence)." });
    }
  } catch { /* briefing is best-effort */ }

  const first = s.name?.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.) /, "").split(" ")[0];
  // Server may run in UTC (Vercel) — compute the hour in IST so the greeting matches the user's clock.
  const hour = parseInt(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()), 10);
  return NextResponse.json({ greeting: `Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, ${first}`, lines });
}
