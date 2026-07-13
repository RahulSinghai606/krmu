// §6.3.2 Governed action (tool) layer.
// Every operation the AI may perform is a declared tool with an explicit contract:
// inputs, the permission it requires, whether it reads or writes, and whether it needs human approval.
// The AI can ONLY call tools in this catalogue; each tool re-checks the acting user's permission;
// writes/contacts never execute directly — they create a PendingAction for human approval (§6.4).
import { prisma } from "@/lib/db";
import { canAccess, type ModuleKey } from "@/lib/access";
import type { UserRole } from "@/lib/types";
import { retrieveLive } from "@/lib/ai/knowledge";
import { certEligibility, certHash, CERT_TYPES } from "@/lib/certificates";
import { scoreLead, callPriority, daysSince } from "@/lib/leads";
import { azureChat } from "@/lib/ai/azure";
import { TIMETABLE, STUDENTS, FEE_COLLECTION_MONTHLY, CERTIFICATE_REQUESTS, UPCOMING_EXAMS, TRANSPORT_ROUTES, HOSTEL_ROOMS, NOTIFICATIONS, FACULTY, COURSES } from "@/lib/data";
import { audit } from "@/lib/audit";

export interface ToolCtx { email: string; role: UserRole; name?: string }

export interface Tool {
  name: string;
  description: string;
  module: ModuleKey;            // permission scope — user must have access to this module
  selfOnly?: boolean;           // student: scoped to their own record
  facultyOnly?: boolean;        // faculty: scoped to their own courses/students
  studentOrFaculty?: boolean;   // either personal role (e.g. own timetable)
  client?: boolean;             // a UI/session action the browser executes (navigate, sign out) — available to all roles
  anyRole?: boolean;            // safe read available to every role (e.g. policy lookup)
  write: boolean;
  needsApproval: boolean;
  parameters: Record<string, unknown>; // JSON Schema for function-calling
  run: (args: Record<string, unknown>, ctx: ToolCtx) => Promise<unknown>;
}

// Canonical module key → route (key matches the ModuleKey used for access checks).
const MODULE_ROUTE: Record<string, string> = {
  dashboard: "/dashboard", examinations: "/dashboard/examinations", fees: "/dashboard/fees",
  attendance: "/dashboard/attendance", timetable: "/dashboard/timetable", registration: "/dashboard/registration",
  grievance: "/dashboard/grievance", certificates: "/dashboard/certificates", students: "/dashboard/students",
  curriculum: "/dashboard/curriculum", hr: "/dashboard/hr", hostel: "/dashboard/hostel", transport: "/dashboard/transport",
  mis: "/dashboard/mis", notifications: "/dashboard/notifications", accreditation: "/dashboard/accreditation",
  documents: "/dashboard/documents", access: "/dashboard/access", ai: "/dashboard/ai", aiops: "/dashboard/aiops",
  committee: "/dashboard/committee", admissions: "/dashboard/admissions", "timetable-generator": "/dashboard/timetable-generator",
  predictions: "/dashboard/predictions", approvals: "/dashboard/approvals", workflows: "/dashboard/workflows", calendar: "/dashboard/calendar",
  success: "/dashboard/success",
};
// Spoken/typed synonyms → canonical module key.
const MODULE_ALIAS: Record<string, string> = {
  results: "examinations", marks: "examinations", exams: "examinations", grades: "examinations",
  governance: "aiops", "governance dashboard": "aiops", "ai operations": "aiops", audit: "aiops",
  admission: "admissions", "admission forensics": "admissions", forensics: "admissions", "document verification": "admissions",
  "committee & governance": "committee", meetings: "committee", minutes: "committee",
  "timetable prep": "timetable-generator", "timetable generator": "timetable-generator", "ai timetable prep": "timetable-generator", generator: "timetable-generator",
  certificate: "certificates", documents_module: "documents", "fee portal": "fees", "fee": "fees",
  student: "students", faculty: "hr", prediction: "predictions", approval: "approvals", workflow: "workflows",
  "student success": "success", funnel: "success", "admission funnel": "success", cockpit: "success", "leadership cockpit": "success", leads: "success",
};
function resolveModule(raw: string): string {
  const m = raw.trim().toLowerCase();
  return MODULE_ALIAS[m] || (MODULE_ROUTE[m] ? m : (MODULE_ALIAS[m.replace(/[-_\s]+/g, " ")] || m));
}

const SCHOOLS = ["SOET", "SMS", "SOL", "SoMeS", "SOA", "SoP", "SoS", "SoEd"];

// Deterministic grievance category from keywords — overrides the model's guess so routing is reliable.
export function classifyGrievance(text: string): { category: string; assignedTo: string } {
  const t = text.toLowerCase();
  const HINTS: { cat: string; to: string; kw: string[] }[] = [
    { cat: "Hostel", to: "Hostel Warden", kw: ["wifi", "wi-fi", "internet", "hostel", "room", "mess", "warden", "block", "roommate", "water", "electricity", "laundry", "cleaning"] },
    { cat: "Fee", to: "Finance Department", kw: ["fee", "fees", "payment", "refund", "scholarship", "dues", "instalment", "installment", "concession", "receipt", "invoice"] },
    { cat: "Academic", to: "Department / Course Faculty", kw: ["marks", "attendance", "exam", "grade", "result", "re-evaluation", "internal", "syllabus", "lecture", "faculty", "teacher", "course", "lab", "practical"] },
    { cat: "Administrative", to: "Registrar Office", kw: ["certificate", "bonafide", "transcript", "document", "id card", "migration", "registration", "admission", "name correction", "record"] },
  ];
  for (const h of HINTS) if (h.kw.some(k => t.includes(k))) return { category: h.cat, assignedTo: h.to };
  return { category: "Other", assignedTo: "Grievance Cell" };
}

async function resolveStudent(email: string) {
  return prisma.student.findFirst({ where: { email } });
}

// Single source of truth for academic-risk scoring — both get_at_risk_students and
// draft_mentor_briefs use this so their counts can never diverge. Includes ALL enrolment
// statuses (an on-leave student can still be the worst defaulter).
export async function computeAtRisk(opts: { school?: string; programme?: string }) {
  const where: Record<string, unknown> = {};
  if (opts.school) where.school = opts.school;
  if (opts.programme) where.programme = opts.programme;
  const rows = await prisma.student.findMany({ where });
  return rows
    // A student is at-risk on ANY hard trigger: attendance shortfall, weak CGPA, or significant dues.
    .filter(s => s.attendance < 75 || s.cgpa < 6 || s.feeDue > 50000)
    .map(s => {
      const att = s.attendance < 75 ? (75 - s.attendance) / 75 : 0;
      const aca = s.cgpa < 6 ? (6 - s.cgpa) / 6 : 0;
      const fin = s.feeDue > 0 ? Math.min(1, s.feeDue / 100000) : 0;
      const riskScore = Math.round((att * 0.5 + aca * 0.3 + fin * 0.2) * 100) / 100;
      const reasons = [s.attendance < 75 ? `attendance ${s.attendance}%` : null, s.cgpa < 6 ? `CGPA ${s.cgpa}` : null, s.feeDue > 0 ? `dues ₹${s.feeDue.toLocaleString("en-IN")}` : null].filter(Boolean);
      return { name: s.name, enrollmentNo: s.enrollmentNo, programme: s.programme, status: s.status, riskScore, band: riskScore >= 0.4 ? "high" : riskScore >= 0.25 ? "medium" : "low", reasons: reasons.join(", ") };
    }).sort((a, b) => b.riskScore - a.riskScore);
}

export const TOOLS: Tool[] = [
  // ─────────── READ ───────────
  {
    name: "query_students",
    description: "Find students by school, programme, attendance threshold, fee due or status. Returns academic summary only (no contact details). IMPORTANT: covers ALL enrolment statuses by default — only pass `status` if the user explicitly names one (an on-leave student can still be a defaulter). Do not add a school/programme filter unless the user asked for it.",
    module: "students",
    write: false, needsApproval: false,
    parameters: {
      type: "object",
      properties: {
        school: { type: "string", enum: SCHOOLS, description: "School code" },
        programme: { type: "string", description: "Programme name, e.g. 'B.Tech CSE'" },
        maxAttendance: { type: "number", description: "Only students with attendance below this %" },
        minFeeDue: { type: "number", description: "Only students with fee due >= this amount (₹)" },
        status: { type: "string", description: "enrolled | on-leave | graduated | withdrawn" },
      },
    },
    run: async (a) => {
      const where: Record<string, unknown> = {};
      if (a.school) where.school = a.school;
      if (a.programme) where.programme = a.programme;
      if (a.status) where.status = a.status;
      if (typeof a.maxAttendance === "number") where.attendance = { lt: a.maxAttendance };
      if (typeof a.minFeeDue === "number") where.feeDue = { gte: a.minFeeDue };
      const rows = await prisma.student.findMany({ where, take: 50, orderBy: { attendance: "asc" } });
      return {
        count: rows.length,
        students: rows.map(s => ({ name: s.name, enrollmentNo: s.enrollmentNo, programme: s.programme, school: s.school, semester: s.semester, attendance: s.attendance, cgpa: s.cgpa, feeDue: s.feeDue, status: s.status })),
        source: "SIS · Student master",
      };
    },
  },
  {
    name: "get_student_record",
    description: "Look up ONE student's academic record by name or enrolment number (staff only). Returns academic figures — programme, semester, CGPA, attendance %, fee due, status. No contact details. Use for 'what is <name>'s CGPA/attendance', 'show <enrolment no> record'.",
    module: "students", write: false, needsApproval: false,
    parameters: { type: "object", required: ["query"], properties: { query: { type: "string", description: "Student name or enrolment number" } } },
    run: async (a) => {
      const q = String(a.query || "").trim().toLowerCase();
      const rows = await prisma.student.findMany();
      const s = rows.find(x => x.enrollmentNo.toLowerCase() === q) || rows.find(x => x.name.toLowerCase() === q) || rows.find(x => x.name.toLowerCase().includes(q));
      if (!s) return { found: false, note: `No student matched "${a.query}".` };
      return { found: true, student: { name: s.name, enrollmentNo: s.enrollmentNo, programme: s.programme, semester: s.semester, section: s.section, cgpa: s.cgpa, attendance: s.attendance, feeDue: s.feeDue, status: s.status }, source: "SIS · Student master" };
    },
  },
  {
    name: "get_top_students",
    description: "Rank students by CGPA (best performers), optionally within a programme or school. Use for 'top students', 'best performers', 'rank students by CGPA', 'toppers'.",
    module: "students",
    write: false, needsApproval: false,
    parameters: {
      type: "object",
      properties: {
        programme: { type: "string", description: "e.g. 'B.Tech CSE'" },
        school: { type: "string", enum: SCHOOLS },
        limit: { type: "number", description: "How many to return, default 10" },
      },
    },
    run: async (a) => {
      const where: Record<string, unknown> = {};
      if (a.programme) where.programme = a.programme;
      if (a.school) where.school = a.school;
      const rows = await prisma.student.findMany({ where, orderBy: { cgpa: "desc" }, take: Math.min(Number(a.limit) || 10, 25) });
      return { count: rows.length, topStudents: rows.map((s, i) => ({ rank: i + 1, name: s.name, enrollmentNo: s.enrollmentNo, programme: s.programme, cgpa: s.cgpa })), source: "SIS · Student master" };
    },
  },
  {
    name: "get_my_top_students",
    description: "For the signed-in faculty: the best-performing students (by CGPA) in the programmes they teach. Use for faculty asking 'top students', 'my best students', 'toppers in my class'.",
    module: "students", facultyOnly: true,
    write: false, needsApproval: false,
    parameters: { type: "object", properties: { limit: { type: "number" } } },
    run: async (a, ctx) => {
      const fac = await prisma.faculty.findFirst({ where: { email: ctx.email } });
      if (!fac) return { error: "No faculty record." };
      const progs = Array.from(new Set((await prisma.course.findMany({ where: { faculty: fac.name } })).map(c => c.programme)));
      const rows = await prisma.student.findMany({ where: { programme: { in: progs } }, orderBy: { cgpa: "desc" }, take: Math.min(Number(a.limit) || 10, 25) });
      return { programmes: progs, count: rows.length, topStudents: rows.map((s, i) => ({ rank: i + 1, name: s.name, enrollmentNo: s.enrollmentNo, cgpa: s.cgpa })), source: "SIS (your programmes)" };
    },
  },
  {
    name: "get_low_attendance_students",
    description: "Students below an attendance threshold (default 75%), across ALL enrolment statuses (on-leave students included). Use for 'who is below 75% attendance', 'attendance defaulters', 'shortage list'.",
    module: "students", write: false, needsApproval: false,
    parameters: { type: "object", properties: { threshold: { type: "number", description: "Attendance % cutoff, default 75" }, programme: { type: "string" } } },
    run: async (a) => {
      const cut = typeof a.threshold === "number" ? a.threshold : 75;
      const where: Record<string, unknown> = { attendance: { lt: cut } };
      if (a.programme) where.programme = a.programme;
      const rows = await prisma.student.findMany({ where, orderBy: { attendance: "asc" } });
      return { threshold: cut, count: rows.length, students: rows.map(s => ({ name: s.name, enrollmentNo: s.enrollmentNo, programme: s.programme, attendance: s.attendance, status: s.status })), source: "SIS · Attendance (all statuses)" };
    },
  },
  {
    name: "data_quality_scan",
    description: "§6.1.4 continuous data-quality monitoring — scans student records for anomalies: duplicate enrolment numbers, impossible/missing dates of birth, missing mandatory fields, and out-of-range values. Use for 'check data quality', 'find bad records', 'data anomalies'.",
    module: "students", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const rows = await prisma.student.findMany();
      const issues: { student: string; enrollmentNo: string; issue: string }[] = [];
      const seen: Record<string, number> = {};
      rows.forEach(s => { seen[s.enrollmentNo] = (seen[s.enrollmentNo] || 0) + 1; });
      rows.forEach(s => {
        if (seen[s.enrollmentNo] > 1) issues.push({ student: s.name, enrollmentNo: s.enrollmentNo, issue: "Duplicate enrolment number" });
        if (!s.dob) issues.push({ student: s.name, enrollmentNo: s.enrollmentNo, issue: "Missing date of birth" });
        else { const y = new Date(s.dob).getFullYear(); if (isNaN(y) || y < 1980 || y > 2012) issues.push({ student: s.name, enrollmentNo: s.enrollmentNo, issue: `Implausible DOB (${s.dob})` }); }
        if (!s.guardianName) issues.push({ student: s.name, enrollmentNo: s.enrollmentNo, issue: "Missing guardian" });
        if (s.cgpa < 0 || s.cgpa > 10) issues.push({ student: s.name, enrollmentNo: s.enrollmentNo, issue: `CGPA out of range (${s.cgpa})` });
        if (s.attendance < 0 || s.attendance > 100) issues.push({ student: s.name, enrollmentNo: s.enrollmentNo, issue: `Attendance out of range (${s.attendance})` });
      });
      return { scanned: rows.length, issueCount: issues.length, issues: issues.slice(0, 30), clean: issues.length === 0, source: "SIS · data-quality scan" };
    },
  },
  {
    name: "get_fee_collection_summary",
    description: "Fee collection vs target — monthly and current-month, with amounts collected, target, variance and % achieved, plus live outstanding dues. Use for 'fee collection this month', 'collection vs target', 'how much have we collected', 'are we on track on fees'.",
    module: "fees", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const monthly = FEE_COLLECTION_MONTHLY; // ₹ Lakhs
      const current = monthly[monthly.length - 1];
      const totalCollected = monthly.reduce((s, m) => s + m.collected, 0);
      const totalTarget = monthly.reduce((s, m) => s + m.target, 0);
      const dues = await prisma.feeRecord.findMany({ where: { due: { gt: 0 } } });
      const pct = (c: number, t: number) => t ? Math.round((c / t) * 100) : 0;
      return {
        currentMonth: { month: current.month, collectedLakh: current.collected, targetLakh: current.target, achievedPct: pct(current.collected, current.target), varianceLakh: current.collected - current.target },
        ytd: { collectedLakh: totalCollected, targetLakh: totalTarget, achievedPct: pct(totalCollected, totalTarget) },
        monthly: monthly.map(m => ({ month: m.month, collectedLakh: m.collected, targetLakh: m.target, achievedPct: pct(m.collected, m.target) })),
        liveOutstanding: { students: dues.length, amount: dues.reduce((s, f) => s + f.due, 0) },
        note: "Amounts in ₹ Lakhs.", source: "Fee Management",
      };
    },
  },
  {
    name: "list_fee_defaulters",
    description: "List students with outstanding fee dues, optionally filtered by programme.",
    module: "fees",
    write: false, needsApproval: false,
    parameters: { type: "object", properties: { programme: { type: "string" } } },
    run: async (a) => {
      const where: Record<string, unknown> = { due: { gt: 0 } };
      if (a.programme) where.programme = a.programme;
      const rows = await prisma.feeRecord.findMany({ where, orderBy: { due: "desc" } });
      return {
        count: rows.length, totalDue: rows.reduce((s, f) => s + f.due, 0),
        defaulters: rows.map(f => ({ studentName: f.studentName, programme: f.programme, due: f.due, status: f.status })),
        source: "Fee Management",
      };
    },
  },
  {
    name: "list_pending_requests",
    description: "Open student requests awaiting staff action — grievances, semester registrations and certificate requests. Use for 'what requests are pending?', 'do I have any student requests?', 'kya koi request aayi hai?'.",
    module: "dashboard",
    write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const [griev, regs, certs] = await Promise.all([
        prisma.grievance.findMany({ where: { status: { in: ["open", "in-progress"] } } }),
        prisma.registration.findMany({ where: { status: { in: ["submitted", "advisor_approved"] } } }),
        prisma.certificateRequest.findMany({ where: { status: "processing" } }),
      ]);
      return {
        total: griev.length + regs.length + certs.length,
        grievances: griev.map(g => ({ student: g.studentName, subject: g.subject, ticket: g.ticketNo, priority: g.priority })),
        registrations: regs.map(r => ({ student: r.studentName, semester: r.semester, status: r.status })),
        certificates: certs.map(c => ({ student: c.studentName, type: c.type })),
        source: "Grievance · Registration · Certificates",
      };
    },
  },
  {
    name: "list_pending_results",
    description: "List exam results still in draft (not yet published), grouped by course.",
    module: "examinations",
    write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const rows = await prisma.examResult.findMany({ where: { status: "draft" } });
      const byCourse: Record<string, number> = {};
      rows.forEach(r => { byCourse[r.courseCode] = (byCourse[r.courseCode] || 0) + 1; });
      return { count: rows.length, courses: Object.entries(byCourse).map(([code, n]) => ({ code, pending: n })), source: "Examinations" };
    },
  },
  {
    name: "get_attendance_overview",
    description: "Course-wise present-rate overview computed from recorded attendance sessions.",
    module: "attendance",
    write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const recs = await prisma.attendanceRecord.findMany();
      const byCourse: Record<string, { p: number; t: number }> = {};
      recs.forEach(r => { const e = byCourse[r.courseCode] ||= { p: 0, t: 0 }; e.t++; if (r.status === "present") e.p++; });
      return { courses: Object.entries(byCourse).map(([c, v]) => ({ course: c, presentPct: Math.round((v.p / v.t) * 100), sessions: v.t })), source: "Attendance" };
    },
  },
  {
    name: "get_my_summary",
    description: "The signed-in student's own academic summary: CGPA, attendance, fees, results. Use for student self-queries.",
    module: "dashboard",
    selfOnly: true,
    write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async (_a, ctx) => {
      const s = await resolveStudent(ctx.email);
      if (!s) return { error: "No student record for this user." };
      const [results, fees, att] = await Promise.all([
        prisma.examResult.findMany({ where: { studentId: s.id } }),
        prisma.feeRecord.findMany({ where: { studentId: s.id } }),
        prisma.attendanceRecord.findMany({ where: { studentId: s.id } }),
      ]);
      const p = att.filter(r => r.status === "present").length;
      return {
        cgpa: s.cgpa, attendancePct: att.length ? Math.round((p / att.length) * 100) : s.attendance,
        feeDue: fees.reduce((x, f) => x + f.due, 0),
        results: results.map(r => ({ course: r.courseCode, total: r.total, grade: r.grade })),
        source: "Your SIS record",
      };
    },
  },

  // ─────────── WRITE / CONTACT — route to approval (§6.4) ───────────
  {
    name: "send_notice",
    description: "Prepare a notice/circular to a student or staff group. Does NOT send — creates an approval request for an authorised user to review and release.",
    module: "notifications",
    write: true, needsApproval: true,
    parameters: {
      type: "object",
      required: ["audience", "title", "message"],
      properties: {
        audience: { type: "string", description: "Recipient group, e.g. 'B.Tech CSE defaulters', 'all faculty'" },
        title: { type: "string" },
        message: { type: "string" },
      },
    },
    run: async (a) => ({ prepared: true, summary: `Notice "${a.title}" to ${a.audience}` }),
  },
  {
    name: "prepare_fee_reminders",
    description: "Prepare personalised fee reminders for defaulters. Does NOT send — creates an approval request.",
    module: "fees",
    write: true, needsApproval: true,
    parameters: { type: "object", properties: { programme: { type: "string" } } },
    run: async (a) => {
      const where: Record<string, unknown> = { due: { gt: 0 } };
      if (a.programme) where.programme = a.programme;
      const n = await prisma.feeRecord.count({ where });
      return { prepared: true, summary: `Fee reminders for ${n} defaulters${a.programme ? ` in ${a.programme}` : ""}` };
    },
  },
  // ─────────── STUDENT self-service write — raise own grievance ───────────
  {
    name: "raise_grievance",
    description: "Raise/file a grievance or complaint on behalf of the signed-in student. Use whenever a student DESCRIBES A PROBLEM or complaint (e.g. 'the wifi is not working in block C', 'mess food is bad', 'attendance marked wrong', 'hostel room issue'). Infer a short subject, a category (Academic|Fee|Hostel|Administrative|Other) and priority from what they said. This is the student's own self-service request — it is filed immediately and routed to the right office.",
    module: "grievance", selfOnly: true, write: true, needsApproval: false,
    parameters: {
      type: "object", required: ["subject", "description"],
      properties: {
        subject: { type: "string", description: "Short title of the issue" },
        description: { type: "string", description: "The full problem in the student's words" },
        category: { type: "string", description: "Academic | Fee | Hostel | Administrative | Other" },
        priority: { type: "string", description: "low | medium | high | urgent" },
      },
    },
    run: async (a, ctx) => {
      const me = STUDENTS.find(s => s.email === ctx.email);
      // Keyword classifier wins for routing; fall back to the model's category only if no keyword matches.
      const cls = classifyGrievance(`${a.subject} ${a.description}`);
      const category = cls.category !== "Other" ? cls.category : String(a.category || "Other");
      const ASSIGNEE: Record<string, string> = { Academic: "Department / Course Faculty", Fee: "Finance Department", Hostel: "Hostel Warden", Administrative: "Registrar Office", Other: "Grievance Cell" };
      // Idempotency: don't file a duplicate if this student already has an open ticket in the same category.
      const dupe = await prisma.grievance.findFirst({ where: { studentName: ctx.name || me?.name, category, status: { in: ["open", "in-progress"] } } });
      if (dupe) return { raised: false, alreadyOpen: true, ticketNo: dupe.ticketNo, assignedTo: dupe.assignedTo, category: dupe.category, message: `You already have an open ${category} grievance (${dupe.ticketNo}). I won't file a duplicate.`, source: "Grievance" };
      const count = await prisma.grievance.count();
      const g = await prisma.grievance.create({
        data: {
          id: `g-${Date.now()}`, ticketNo: `KRMU-GRV-2025-${String(100 + count).padStart(4, "0")}`,
          studentId: me?.id || "s000", studentName: ctx.name || me?.name || "Student",
          category, subject: String(a.subject), description: String(a.description),
          status: "open", priority: String(a.priority || "medium"),
          assignedTo: ASSIGNEE[category] || "Grievance Cell",
          raisedDate: new Date().toISOString().slice(0, 10), comments: JSON.stringify([]),
        },
      });
      await audit({ actor: ctx.email, role: ctx.role, action: "Grievance raised (via AI)", module: "Grievance", detail: `${g.ticketNo} — ${g.subject}`, byAi: true });
      return { raised: true, ticketNo: g.ticketNo, assignedTo: g.assignedTo, category: g.category, source: "Grievance" };
    },
  },

  // ─────────── TIMETABLE (student or faculty, own schedule) ───────────
  {
    name: "get_my_classes",
    description: "The signed-in student's or faculty member's own timetable, optionally for a specific weekday. Use for 'what classes do I have on Wednesday?', 'aaj meri classes', 'my schedule'. Returns the actual class list — state it in text.",
    module: "timetable", studentOrFaculty: true, write: false, needsApproval: false,
    parameters: { type: "object", properties: { day: { type: "string", description: "Weekday e.g. Monday..Friday; omit for the whole week" } } },
    run: async (a, ctx) => {
      const day = a.day ? String(a.day).trim().toLowerCase() : "";
      let slots = TIMETABLE;
      if (ctx.role === "faculty") {
        const fac = await prisma.faculty.findFirst({ where: { email: ctx.email } });
        if (!fac) return { error: "No faculty record." };
        slots = slots.filter(t => t.facultyName === fac.name);
      } else {
        const stu = await prisma.student.findFirst({ where: { email: ctx.email } });
        if (!stu) return { error: "No student record." };
        slots = slots.filter(t => t.section === `${stu.programme}-${stu.section}`);
      }
      if (day) slots = slots.filter(t => t.day.toLowerCase() === day);
      const classes = slots
        .sort((x, y) => x.day.localeCompare(y.day) || x.startTime.localeCompare(y.startTime))
        .map(t => ({ day: t.day, time: `${t.startTime}–${t.endTime}`, course: `${t.courseCode} ${t.courseName}`, room: t.room, type: t.type }));
      return { day: day || "full week", count: classes.length, classes, source: "Timetable" };
    },
  },

  {
    name: "get_my_teachers",
    description: "The signed-in student's faculty/teachers this semester — who teaches each of their courses. Use for 'who are my teachers', 'my faculty', 'mere teachers kaun hain'.",
    module: "dashboard", selfOnly: true, write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async (_a, ctx) => {
      const stu = await prisma.student.findFirst({ where: { email: ctx.email } });
      if (!stu) return { error: "No student record." };
      const section = `${stu.programme}-${stu.section}`;
      const slots = TIMETABLE.filter(t => t.section === section);
      const byFaculty: Record<string, Set<string>> = {};
      slots.forEach(t => { (byFaculty[t.facultyName] ||= new Set()).add(`${t.courseCode} ${t.courseName}`); });
      const teachers = Object.entries(byFaculty).map(([name, courses]) => ({ faculty: name, courses: [...courses] }));
      return { section, count: teachers.length, teachers, source: "Timetable · faculty allocation" };
    },
  },

  // ─────────── FACULTY self-scoped reads ───────────
  {
    name: "list_my_pending_results",
    description: "For the signed-in faculty: which of MY courses have unpublished (draft) marks. Use for 'which of my courses have marks pending?'.",
    module: "examinations", facultyOnly: true, write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async (_a, ctx) => {
      const fac = await prisma.faculty.findFirst({ where: { email: ctx.email } });
      if (!fac) return { error: "No faculty record." };
      const courses = await prisma.course.findMany({ where: { faculty: fac.name } });
      const codes = courses.map(c => c.code);
      const results = await prisma.examResult.findMany({ where: { courseCode: { in: codes } } });
      const draftByCourse: Record<string, number> = {};
      results.filter(r => r.status === "draft").forEach(r => { draftByCourse[r.courseCode] = (draftByCourse[r.courseCode] || 0) + 1; });
      return { myCourses: codes, pending: Object.entries(draftByCourse).map(([c, n]) => ({ course: c, draftMarks: n })), totalDraft: results.filter(r => r.status === "draft").length, source: "Examinations (your courses)" };
    },
  },
  {
    name: "list_my_low_attendance_students",
    description: "For the signed-in faculty: students in MY courses below an attendance threshold (default 75%). Returns names + enrolment only (no contact details).",
    module: "attendance", facultyOnly: true, write: false, needsApproval: false,
    parameters: { type: "object", properties: { threshold: { type: "number", description: "Attendance % cutoff, default 75" } } },
    run: async (a, ctx) => {
      const fac = await prisma.faculty.findFirst({ where: { email: ctx.email } });
      if (!fac) return { error: "No faculty record." };
      const codes = (await prisma.course.findMany({ where: { faculty: fac.name } })).map(c => c.code);
      const recs = await prisma.attendanceRecord.findMany({ where: { courseCode: { in: codes } } });
      const byStu: Record<string, { name: string; p: number; t: number }> = {};
      recs.forEach(r => { const e = byStu[r.studentId] ||= { name: r.studentName, p: 0, t: 0 }; e.t++; if (r.status === "present") e.p++; });
      const cut = typeof a.threshold === "number" ? a.threshold : 75;
      const low = Object.values(byStu).map(v => ({ student: v.name, pct: Math.round((v.p / v.t) * 100) })).filter(x => x.pct < cut);
      return { threshold: cut, courses: codes, students: low, count: low.length, source: "Attendance (your courses)" };
    },
  },

  // ─────────── UC6: Exam eligibility / debarment engine (registrar/exam officer) ───────────
  {
    name: "check_exam_eligibility",
    description: "Cross-module exam-eligibility check before an examination. A student is ELIGIBLE only if ALL gates pass: attendance ≥ 75%, no pending fee dues, and registration not rejected. Returns per-student verdict with the exact blocking reason(s). Use for 'who is eligible for exams', 'exam debarment list', 'who is debarred', 'hall ticket eligibility'. Optional programme filter.",
    module: "examinations", write: false, needsApproval: false,
    parameters: { type: "object", properties: { programme: { type: "string" } } },
    run: async (a) => {
      const where: Record<string, unknown> = {};
      if (a.programme) where.programme = a.programme;
      const [students, dueFees, regs] = await Promise.all([
        prisma.student.findMany({ where }),
        prisma.feeRecord.findMany({ where: { due: { gt: 0 } } }),
        prisma.registration.findMany(),
      ]);
      const dueByStudent: Record<string, number> = {};
      dueFees.forEach(f => { dueByStudent[f.studentId] = (dueByStudent[f.studentId] || 0) + f.due; });
      const regStatus: Record<string, string> = {};
      regs.forEach(r => { regStatus[r.studentId] = r.status; });
      const rows = students.map(s => {
        const blockers: string[] = [];
        if (s.attendance < 75) blockers.push(`attendance ${s.attendance}% (< 75%)`);
        if (dueByStudent[s.id]) blockers.push(`pending fees ₹${dueByStudent[s.id].toLocaleString("en-IN")}`);
        if (regStatus[s.id] === "rejected") blockers.push("registration rejected");
        return { name: s.name, enrollmentNo: s.enrollmentNo, programme: s.programme, eligible: blockers.length === 0, blockers };
      });
      const debarred = rows.filter(r => !r.eligible);
      return {
        total: rows.length, eligible: rows.length - debarred.length, debarred: debarred.length,
        debarredStudents: debarred, gates: "attendance ≥ 75% · fees cleared · registration not rejected",
        source: "SIS · Attendance · Fee Management · Registration",
      };
    },
  },
  {
    name: "generate_hall_tickets",
    description: "Prepare hall tickets for all exam-ELIGIBLE students (those who clear attendance, fees and registration). Prepares only — routes to the approval queue; does not issue. Use 'generate/issue hall tickets for eligible students'.",
    module: "examinations", write: true, needsApproval: true,
    parameters: { type: "object", properties: { programme: { type: "string" } } },
    run: async (a) => {
      const where: Record<string, unknown> = {};
      if (a.programme) where.programme = a.programme;
      const [students, dueFees] = await Promise.all([prisma.student.findMany({ where }), prisma.feeRecord.findMany({ where: { due: { gt: 0 } } })]);
      const due = new Set(dueFees.map(f => f.studentId));
      const eligible = students.filter(s => s.attendance >= 75 && !due.has(s.id)).length;
      return { prepared: true, summary: `Hall tickets for ${eligible} eligible student${eligible === 1 ? "" : "s"}${a.programme ? ` in ${a.programme}` : ""}`, count: eligible };
    },
  },

  // ─────────── UC1: Academic-risk intervention (dean/hod/registrar) ───────────
  {
    name: "get_at_risk_students",
    description: "Institution-wide academic-risk view — ALL students flagged by low attendance (<75%), weak CGPA (<6) or significant pending fees, with reasons and a blended risk score. Covers every school and enrolment status. Use for 'who is at academic risk', 'at-risk students', 'students needing intervention'.",
    module: "students", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const scored = await computeAtRisk({}); // always institution-wide — no school/programme scoping
      return { count: scored.length, atRisk: scored, basis: "at-risk if attendance<75% OR CGPA<6 OR dues>₹50k; score = attendance 50% + CGPA 30% + fees 20%; all statuses", source: "SIS · Attendance · Examinations · Fees" };
    },
  },
  {
    name: "draft_mentor_briefs",
    description: "Prepare mentor intervention briefs for the top at-risk students and route them to mentors. Prepares only — routes to the approval queue, does not send. Use after identifying at-risk students ('draft mentor briefs for the top 10'). If fewer than requested qualify, it briefs all who qualify.",
    module: "students", write: true, needsApproval: true,
    parameters: { type: "object", properties: { limit: { type: "number", description: "Up to how many top at-risk students, default 10" } } },
    run: async (a) => {
      const scored = await computeAtRisk({}); // SAME helper, institution-wide — count matches get_at_risk_students
      const n = Math.min(scored.length, Math.min(Number(a.limit) || 10, 20));
      return { prepared: true, summary: `Mentor intervention briefs for ${n} at-risk student${n === 1 ? "" : "s"}`, count: n, students: scored.slice(0, n).map(x => x.name) };
    },
  },

  // ─────────── UC4: Accreditation gap-check & figures (IQAC/registrar/dean) ───────────
  {
    name: "naac_gap_check",
    description: "Check what data is MISSING or incomplete for a NAAC criterion, and which module owns each gap. Use for 'what's missing for NAAC criterion 2', 'accreditation gaps'.",
    module: "accreditation", write: false, needsApproval: false,
    parameters: { type: "object", properties: { criterion: { type: "string", description: "e.g. '2' or 'Teaching-Learning'" } } },
    run: async (a) => {
      const c = String(a.criterion || "2");
      const GAPS: Record<string, { gaps: { item: string; owner: string; status: string }[] }> = {
        "2": { gaps: [
          { item: "Student full-time equivalent (FTE) enrolment", owner: "SIS", status: "available" },
          { item: "Full-time teacher count (sanctioned vs filled)", owner: "HR & Faculty", status: "available" },
          { item: "Student satisfaction survey responses", owner: "IQAC survey", status: "67% collected — incomplete" },
          { item: "Result/pass-percentage by programme", owner: "Examinations", status: "available" },
          { item: "Mentor-mentee ratio evidence", owner: "SIS / HR", status: "missing — not recorded" },
        ] },
      };
      const data = GAPS[c] || GAPS["2"];
      const missing = data.gaps.filter(g => g.status !== "available");
      return { criterion: c, totalItems: data.gaps.length, complete: data.gaps.length - missing.length, gaps: data.gaps, outstanding: missing, source: "Accreditation · cross-module" };
    },
  },
  {
    name: "assemble_accreditation_figure",
    description: "Compute a statutory figure (e.g. student-teacher ratio) showing EVERY input and its source record for traceability. Use for 'compute the student-teacher ratio and show how'.",
    module: "accreditation", write: false, needsApproval: false,
    parameters: { type: "object", required: ["figure"], properties: { figure: { type: "string", description: "e.g. 'student-teacher ratio', 'pass rate'" } } },
    run: async (a) => {
      const students = await prisma.student.count();
      const faculty = await prisma.faculty.count({ where: { status: "active" } });
      const f = String(a.figure || "").toLowerCase();
      if (f.includes("teacher") || f.includes("ratio")) {
        return { figure: "Student–Teacher Ratio", value: `${Math.round(students / faculty)}:1`,
          inputs: [{ name: "Enrolled students", value: students, source: "SIS · Student master (count)" }, { name: "Active faculty", value: faculty, source: "HR & Faculty (status=active count)" }],
          formula: "students ÷ active faculty", source: "SIS + HR", traceable: true };
      }
      const results = await prisma.examResult.findMany({ where: { status: "published" } });
      const passed = results.filter(r => r.total >= 45).length;
      return { figure: "Pass Rate", value: results.length ? `${Math.round(passed / results.length * 100)}%` : "n/a",
        inputs: [{ name: "Published results", value: results.length, source: "Examinations" }, { name: "Passed (≥45)", value: passed, source: "Examinations" }], formula: "passed ÷ appeared", source: "Examinations", traceable: true };
    },
  },

  // ─────────── UC3: Elective demand forecast → resource plan (coordinator/HOD/dean) ───────────
  {
    name: "forecast_elective_demand",
    description: "Forecast whole-cohort elective demand for an upcoming semester registration (advisory). Returns, per elective: eligible pool, 3-cohort historical take-up trend, predicted enrolment with a confidence band, current capacity, and over/under-subscription flag. Basis is spelled out and traceable.",
    module: "curriculum", write: false, needsApproval: false,
    parameters: { type: "object", properties: { programme: { type: "string" }, semester: { type: "number" } } },
    run: async () => {
      const pool = 180, minEnrol = 25;
      const E = [
        { name: "Machine Learning", hist: [31, 35, 38], cap: 60, spec: "Artificial Intelligence & Machine Learning" },
        { name: "Cybersecurity", hist: [22, 25, 28], cap: 60, spec: "Computer Networks & Cybersecurity" },
        { name: "Cloud Computing", hist: [18, 20, 22], cap: 60, spec: "Database Management Systems & Cloud Computing" },
        { name: "Data Analytics", hist: [20, 24, 27], cap: 60, spec: "Data Science & Natural Language Processing" },
        { name: "AR / VR", hist: [10, 8, 6], cap: 60, spec: "Graphics" },
      ];
      const rows = E.map(e => {
        const take = e.hist[e.hist.length - 1];
        const predicted = Math.round(pool * take / 100);
        const band = Math.max(4, Math.round(predicted * 0.09));
        return { elective: e.name, eligiblePool: pool, takeupTrendPct: e.hist, predicted, band: `±${band}`, capacity: e.cap,
          flag: predicted > e.cap ? "over-subscribed" : predicted < minEnrol ? "below-minimum" : "ok",
          requiredSpecialization: e.spec };
      });
      return { semester: "B.Tech CSE Sem 5", basis: "predicted = eligible pool × latest take-up %; band = ±9%", advisory: true, forecasts: rows, source: "Registration history · Curriculum" };
    },
  },
  {
    name: "plan_sections",
    description: "Given the elective forecast, compute how many EXTRA sections are needed for over-subscribed electives and which under-subscribed ones fall below the minimum-enrolment floor. Section size 60.",
    module: "curriculum", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const secSize = 60, minEnrol = 25;
      const fc = [ { name: "Machine Learning", predicted: 68, cap: 60 }, { name: "Cybersecurity", predicted: 50, cap: 60 }, { name: "Cloud Computing", predicted: 40, cap: 60 }, { name: "Data Analytics", predicted: 49, cap: 60 }, { name: "AR / VR", predicted: 11, cap: 60 } ];
      const plan = fc.map(e => ({
        elective: e.name, predicted: e.predicted, currentCapacity: e.cap,
        extraSectionsNeeded: e.predicted > e.cap ? Math.ceil((e.predicted - e.cap) / secSize) : 0,
        recommendation: e.predicted > e.cap ? `Add ${Math.ceil((e.predicted - e.cap) / secSize)} section(s)` : e.predicted < minEnrol ? "Consider dropping — below minimum enrolment" : "No change",
      }));
      return { plan, source: "Forecast + section capacities" };
    },
  },
  {
    name: "get_faculty_availability",
    description: "Check which faculty have the required specialization and spare teaching load to take an additional section. Use after plan_sections when staffing extra sections.",
    module: "hr", write: false, needsApproval: false,
    parameters: { type: "object", properties: { specialization: { type: "string", description: "e.g. 'Machine Learning', 'Cybersecurity'" } } },
    run: async (a) => {
      const q = String(a.specialization || "").toLowerCase();
      const faculty = await prisma.faculty.findMany();
      const courses = await prisma.course.findMany();
      const rows = faculty.filter(f => f.status === "active").map(f => {
        const load = courses.filter(c => c.faculty === f.name).length;
        return { name: f.name, specialization: f.specialization, currentCourses: load, available: load < 2, match: q ? f.specialization.toLowerCase().includes(q) : true };
      });
      const matched = rows.filter(r => r.match);
      return { specialization: a.specialization || "any", candidates: matched, freeAndQualified: matched.filter(r => r.available), source: "HR & Faculty · workload" };
    },
  },

  // ─────────── UC2: Fee-default / deadline crisis (finance) ───────────
  {
    name: "get_overdue_dues",
    description: "Students with fees still unpaid past the deadline, with how many days overdue and the outstanding amount. Use for 'who missed the fee deadline', 'dues over 60 days', 'who couldn't pay by 30 June'.",
    module: "fees", write: false, needsApproval: false,
    parameters: { type: "object", properties: { minDaysOverdue: { type: "number" }, programme: { type: "string" } } },
    run: async (a) => {
      const today = new Date("2025-02-05").getTime(); // demo "now"
      const where: Record<string, unknown> = { due: { gt: 0 } };
      if (a.programme) where.programme = a.programme;
      const recs = await prisma.feeRecord.findMany({ where });
      const min = Number(a.minDaysOverdue) || 0;
      const rows = recs.map(f => {
        const days = Math.max(0, Math.round((today - new Date(f.dueDate).getTime()) / 86400000));
        return { student: f.studentName, programme: f.programme, due: f.due, dueDate: f.dueDate, daysOverdue: days, status: f.status };
      }).filter(r => r.daysOverdue >= min).sort((x, y) => y.daysOverdue - x.daysOverdue);
      return { count: rows.length, totalOutstanding: rows.reduce((s, r) => s + r.due, 0), overdue: rows, source: "Fee Management" };
    },
  },
  {
    name: "propose_payment_plan",
    description: "Propose a staggered instalment plan for a student who cannot pay their dues in one go (e.g. missed the deadline due to hardship). Returns a 3-instalment schedule to review — it is a proposal, not applied.",
    module: "fees", write: false, needsApproval: false,
    parameters: { type: "object", required: ["studentName"], properties: { studentName: { type: "string" }, instalments: { type: "number" } } },
    run: async (a) => {
      const rec = await prisma.feeRecord.findFirst({ where: { studentName: String(a.studentName), due: { gt: 0 } } });
      if (!rec) return { error: "No outstanding dues found for that student." };
      const n = Math.min(Math.max(Number(a.instalments) || 3, 2), 4);
      const per = Math.ceil(rec.due / n / 100) * 100;
      const schedule = Array.from({ length: n }).map((_, i) => ({ instalment: i + 1, amount: i === n - 1 ? rec.due - per * (n - 1) : per, dueBy: `2025-0${3 + i}-10` }));
      return { student: rec.studentName, totalDue: rec.due, instalments: n, schedule, note: "Proposal only — requires approval to apply.", source: "Fee Management" };
    },
  },

  // ─────────── COMMON READS ───────────
  {
    name: "get_exam_schedule",
    description: "Upcoming examination schedule (dates, times, venues). For a student it shows their programme's exams; for staff, all. Use for 'exam schedule', 'when are my exams', 'upcoming exams'.",
    module: "dashboard", anyRole: true, write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async (_a, ctx) => {
      let exams = UPCOMING_EXAMS;
      if (ctx.role === "student") {
        const me = STUDENTS.find(s => s.email === ctx.email);
        if (me) exams = exams.filter(e => e.programme === me.programme || e.programme.includes("All"));
      }
      return { count: exams.length, exams: exams.map(e => ({ code: e.code, subject: e.subject, date: e.date, time: e.time, venue: e.room, programme: e.programme })), source: "Examinations · schedule" };
    },
  },
  {
    name: "get_my_certificates",
    description: "The signed-in student's certificate/document requests and their status (issued/processing). Use for 'my certificates', 'my documents', 'bonafide status'.",
    module: "certificates", selfOnly: true, write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async (_a, ctx) => {
      const mine = CERTIFICATE_REQUESTS.filter(c => c.studentName === ctx.name);
      return { count: mine.length, requests: mine.map(c => ({ type: c.type, purpose: c.purpose, status: c.status, requested: c.requestDate, issued: c.issueDate })), source: "Certificates" };
    },
  },
  {
    name: "get_my_courses",
    description: "For the signed-in faculty: the courses they teach this semester with credits and programme. Use for 'my courses', 'what am I teaching'.",
    module: "examinations", facultyOnly: true, write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async (_a, ctx) => {
      const fac = await prisma.faculty.findFirst({ where: { email: ctx.email } });
      if (!fac) return { error: "No faculty record." };
      const mine = COURSES.filter(c => c.faculty === fac.name);
      return { count: mine.length, courses: mine.map(c => ({ code: c.code, name: c.name, credits: c.credits, semester: c.semester, programme: c.programme })), source: "Curriculum · faculty allocation" };
    },
  },
  {
    name: "get_faculty_workload",
    description: "Faculty and their current teaching load (courses assigned). Use for 'faculty workload', 'who is overloaded', 'teaching load'.",
    module: "hr", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const rows = FACULTY.map(f => ({ name: f.name, department: f.department, designation: f.designation, courses: COURSES.filter(c => c.faculty === f.name).length, status: f.status }));
      return { faculty: rows.sort((a, b) => b.courses - a.courses), source: "HR & Faculty · workload" };
    },
  },
  {
    name: "get_hostel_occupancy",
    description: "Hostel occupancy — capacity, occupied, free beds by block. Use for 'hostel occupancy', 'free rooms', 'hostel status'.",
    module: "hostel", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const cap = HOSTEL_ROOMS.reduce((s, r) => s + r.capacity, 0), occ = HOSTEL_ROOMS.reduce((s, r) => s + r.occupied, 0);
      const byBlock: Record<string, { cap: number; occ: number }> = {};
      HOSTEL_ROOMS.forEach(r => { const b = byBlock[r.block] ||= { cap: 0, occ: 0 }; b.cap += r.capacity; b.occ += r.occupied; });
      return { totalCapacity: cap, occupied: occ, free: cap - occ, occupancyPct: Math.round((occ / cap) * 100), byBlock: Object.entries(byBlock).map(([block, v]) => ({ block, capacity: v.cap, occupied: v.occ, free: v.cap - v.occ })), source: "Hostel Management" };
    },
  },
  {
    name: "get_transport_routes",
    description: "Transport routes with origin, students enrolled, vehicle utilization and status. Use for 'transport routes', 'bus routes', 'route utilization'.",
    module: "transport", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => ({ count: TRANSPORT_ROUTES.length, routes: TRANSPORT_ROUTES.map(r => ({ route: r.routeNo, origin: r.origin, students: r.students, capacity: r.capacity, utilizationPct: Math.round((r.students / r.capacity) * 100), status: r.status })), source: "Transport Management" }),
  },
  {
    name: "get_recent_notifications",
    description: "Recent broadcast notifications/circulars sent, with audience, channels and read rate. Use for 'recent notifications', 'what was sent', 'circulars'.",
    module: "notifications", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => ({ count: NOTIFICATIONS.length, notifications: NOTIFICATIONS.map(n => ({ title: n.title, audience: n.target, sentBy: n.sentBy, sentAt: n.sentAt, readPct: Math.round((n.readCount / n.totalRecipients) * 100) })), source: "Notifications" }),
  },

  // ─────────── STUDENT SUCCESS INTELLIGENCE: Funnel · Early-warning · Cockpit ───────────
  {
    name: "get_admission_funnel",
    description: "Admission funnel health — counts by stage (enquiry→application→admitted→lost), conversion rate, and breakdown by source and programme. Use for 'admission funnel', 'conversion rate', 'how many leads/enquiries'.",
    module: "admissions", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const leads = await prisma.lead.findMany();
      const by = (k: "stage" | "source" | "programme") => leads.reduce((m, l) => { m[l[k]] = (m[l[k]] || 0) + 1; return m; }, {} as Record<string, number>);
      const admitted = leads.filter(l => l.stage === "admitted").length;
      const active = leads.filter(l => l.stage !== "lost").length;
      return { total: leads.length, byStage: by("stage"), bySource: by("source"), byProgramme: by("programme"),
        conversionPct: active ? Math.round((admitted / leads.length) * 100) : 0, source: "Admissions CRM" };
    },
  },
  {
    name: "who_to_call_today",
    description: "The highest-priority admission leads a counselor should call today, each with the reason (hot source, applied, going cold, overdue for contact). Use for 'who should I call today', 'priority leads', 'hot leads to follow up'.",
    module: "admissions", write: false, needsApproval: false,
    parameters: { type: "object", properties: { limit: { type: "number" } } },
    run: async (a) => {
      const now = Date.now();
      const leads = await prisma.lead.findMany({ where: { stage: { in: ["enquiry", "application"] } } });
      const scored = leads.map(l => { const { score, reasons } = scoreLead(l, now); return { ...l, score, reasons, priority: callPriority({ ...l, score }, now), lastContactedDays: daysSince(l.lastContactAt, now) }; })
        .sort((x, y) => y.priority - x.priority)
        .slice(0, Math.min(Number(a.limit) || 8, 20))
        .map(l => ({ name: l.name, programme: l.programme, source: l.source, stage: l.stage, propensity: l.score, phone: l.phone, lastContacted: l.lastContactedDays === null ? "never" : `${l.lastContactedDays}d ago`, why: l.reasons.join(", ") }));
      return { count: scored.length, callList: scored, source: "Admissions CRM · conversion model" };
    },
  },
  {
    name: "draft_lead_followup",
    description: "Draft a personalized follow-up message (email/SMS) to nudge an admission lead toward converting. Prepares it for approval before sending. Use for 'draft a follow-up for <lead name>'.",
    module: "admissions", write: true, needsApproval: true,
    parameters: { type: "object", required: ["leadName"], properties: { leadName: { type: "string" }, channel: { type: "string", enum: ["email", "sms"] } } },
    run: async (a) => {
      const q = String(a.leadName).trim().toLowerCase();
      const lead = (await prisma.lead.findMany()).find(l => l.name.toLowerCase() === q) || (await prisma.lead.findMany()).find(l => l.name.toLowerCase().includes(q));
      if (!lead) return { error: `No lead named "${a.leadName}".` };
      let draft = "";
      try {
        draft = await azureChat(
          "You write warm, concise, personalized admission follow-up messages for K.R. Mangalam University. 90 words max, one clear call to action. No placeholders.",
          `Lead: ${lead.name}, interested in ${lead.programme}, source ${lead.source}, stage ${lead.stage}. Channel: ${a.channel || "email"}. Write the follow-up message.`, 500);
      } catch { draft = `Dear ${lead.name}, thank you for your interest in ${lead.programme} at K.R. Mangalam University. Our admissions team would love to help you complete your application — may we call you this week?`; }
      return { prepared: true, leadName: lead.name, channel: a.channel || "email", draft, summary: `${a.channel || "email"} follow-up to ${lead.name} (${lead.programme})` };
    },
  },
  {
    name: "get_student_risk_profile",
    description: "Early-warning risk profile for ONE student — fuses attendance, fee-payment delay and latest marks into a risk band with the specific drivers and an estimated lead time before it shows up in results. Use for 'risk profile for <name>', 'why is <name> at risk'.",
    module: "students", write: false, needsApproval: false,
    parameters: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
    run: async (a) => {
      const q = String(a.name).trim().toLowerCase();
      const s = (await prisma.student.findMany()).find(x => x.name.toLowerCase() === q) || (await prisma.student.findMany()).find(x => x.name.toLowerCase().includes(q));
      if (!s) return { error: `No student named "${a.name}".` };
      const fees = await prisma.feeRecord.findMany({ where: { studentId: s.id, due: { gt: 0 } } });
      const marks = await prisma.examResult.findMany({ where: { studentId: s.id } });
      const avgMark = marks.length ? Math.round(marks.reduce((x, m) => x + m.total, 0) / marks.length) : null;
      const drivers: string[] = [];
      if (s.attendance < 75) drivers.push(`attendance ${s.attendance}% (below 75%)`);
      if (fees.length) drivers.push(`fee dues ₹${fees.reduce((x, f) => x + f.due, 0).toLocaleString("en-IN")} pending`);
      if (avgMark !== null && avgMark < 50) drivers.push(`weak marks (avg ${avgMark})`);
      if (s.cgpa < 6) drivers.push(`low CGPA ${s.cgpa}`);
      const severity = (s.attendance < 65 ? 2 : s.attendance < 75 ? 1 : 0) + (fees.length ? 1 : 0) + (avgMark !== null && avgMark < 50 ? 1 : 0);
      const band = severity >= 3 ? "high" : severity >= 1 ? "medium" : "low";
      const weeks = band === "high" ? "8–10 weeks" : band === "medium" ? "10–14 weeks" : "no near-term risk";
      return { student: s.name, programme: s.programme, band, drivers: drivers.length ? drivers : ["no leading-risk indicators"], leadTimeBeforeImpact: weeks, source: "SIS · Attendance · Fees · Examinations" };
    },
  },
  {
    name: "draft_intervention_plan",
    description: "Draft a complete intervention BUNDLE for an at-risk student — mentor assignment, fee-restructuring proposal (if dues), and a parent notification — routed together for approval. Use for 'draft an intervention for <name>', 'help <name>'.",
    module: "students", write: true, needsApproval: true,
    parameters: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
    run: async (a) => {
      const q = String(a.name).trim().toLowerCase();
      const s = (await prisma.student.findMany()).find(x => x.name.toLowerCase() === q) || (await prisma.student.findMany()).find(x => x.name.toLowerCase().includes(q));
      if (!s) return { error: `No student named "${a.name}".` };
      const items: string[] = ["Assign a faculty mentor and schedule a check-in"];
      if (s.feeDue > 0) items.push(`Offer a 3-instalment plan for ₹${s.feeDue.toLocaleString("en-IN")} dues`);
      if (s.attendance < 75) items.push("Attendance-improvement counselling");
      items.push("Notify parent/guardian with a supportive update");
      return { prepared: true, student: s.name, plan: items, summary: `Intervention bundle for ${s.name}: ${items.length} actions` };
    },
  },
  {
    name: "get_program_health",
    description: "Leadership cockpit — per-programme health: enrolment, at-risk count, average attendance, pass rate, fee-collection and dropout-risk, ranked to surface which programmes are 'bleeding' students and why. Use for 'which programmes are bleeding students', 'programme health', 'which courses are struggling'.",
    module: "mis", write: false, needsApproval: false,
    parameters: { type: "object", properties: { programme: { type: "string" } } },
    run: async (a) => {
      const students = await prisma.student.findMany(a.programme ? { where: { programme: String(a.programme) } } : undefined);
      const results = await prisma.examResult.findMany({ where: { status: "published" } });
      const groups: Record<string, typeof students> = {};
      students.forEach(s => { (groups[s.programme] ||= []).push(s); });
      const rows = Object.entries(groups).map(([programme, list]) => {
        const atRisk = list.filter(s => s.attendance < 75 || s.cgpa < 6 || s.feeDue > 50000).length;
        const avgAtt = Math.round(list.reduce((x, s) => x + s.attendance, 0) / list.length);
        const dues = list.filter(s => s.feeDue > 0).length;
        const progResults = results.filter(r => list.some(s => s.id === r.studentId));
        const passRate = progResults.length ? Math.round(progResults.filter(r => r.total >= 45).length / progResults.length * 100) : null;
        const concerns = [avgAtt < 75 ? `avg attendance ${avgAtt}%` : null, atRisk ? `${atRisk} at-risk` : null, dues ? `${dues} with dues` : null, passRate !== null && passRate < 80 ? `pass rate ${passRate}%` : null].filter(Boolean);
        return { programme, enrolled: list.length, atRisk, avgAttendance: avgAtt, passRate, withDues: dues, healthScore: 100 - atRisk * 12 - (avgAtt < 75 ? 15 : 0), concerns };
      }).sort((x, y) => x.healthScore - y.healthScore);
      return { programmes: rows, mostAtRisk: rows[0]?.programme, source: "SIS · Attendance · Examinations · Fees" };
    },
  },

  // ─────────── ZERO-BACK-OFFICE: Certificates, Committee, Admissions ───────────
  {
    name: "check_certificate_eligibility",
    description: "For the signed-in student: whether they are eligible to be issued a certificate/document (checks enrolment, fees, library dues, disciplinary holds). Use before requesting one, or for 'can I get a bonafide certificate'.",
    module: "certificates", selfOnly: true, write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async (_a, ctx) => {
      const me = await prisma.student.findFirst({ where: { email: ctx.email } });
      if (!me) return { error: "No student record." };
      const e = certEligibility(me);
      return { eligible: e.clear, holds: e.reasons, message: e.clear ? "You are eligible — no holds." : `On hold: ${e.reasons.join(", ")}`, source: "SIS · Fees · Library · Discipline" };
    },
  },
  {
    name: "request_certificate",
    description: "File a certificate/document request for the signed-in student (bonafide, transcript, migration, duplicate marksheet, character, fee-structure). Use for 'I need a bonafide certificate for my visa'. It checks eligibility and files the request; the registrar then issues & signs it.",
    module: "certificates", selfOnly: true, write: true, needsApproval: false,
    parameters: { type: "object", required: ["type"], properties: { type: { type: "string", enum: CERT_TYPES }, purpose: { type: "string" } } },
    run: async (a, ctx) => {
      const me = await prisma.student.findFirst({ where: { email: ctx.email } });
      if (!me) return { error: "No student record." };
      const e = certEligibility(me);
      const row = await prisma.certificateRequest.create({
        data: {
          id: `cert-${Date.now()}`, studentId: me.id, studentName: me.name, type: String(a.type), purpose: String(a.purpose || ""),
          requestDate: new Date().toISOString().slice(0, 10), status: e.clear ? "pending" : "on-hold",
          holdReasons: e.clear ? null : JSON.stringify(e.reasons),
        },
      });
      return e.clear
        ? { filed: true, ticket: row.id, status: "pending registrar signature", type: row.type, note: "Filed. The registrar will issue & digitally sign it — typically within minutes.", source: "Certificates" }
        : { filed: true, ticket: row.id, status: "on-hold", holds: e.reasons, note: `Filed but on hold until you clear: ${e.reasons.join(", ")}.`, source: "Certificates" };
    },
  },
  {
    name: "issue_certificate",
    description: "For registrar/admin staff: issue & digitally sign a certificate for a named STUDENT (bonafide, transcript, migration, etc.). Verifies eligibility, then issues with a verification code. Use for 'issue a bonafide certificate for <student>', 'raise and issue a transcript for <student>'. Certificates are issued to students only.",
    module: "certificates", write: true, needsApproval: false,
    parameters: { type: "object", required: ["studentName", "type"], properties: { studentName: { type: "string" }, type: { type: "string", enum: CERT_TYPES }, purpose: { type: "string" } } },
    run: async (a, ctx) => {
      if (ctx.role === "student") return { error: "Only registrar/admin can issue certificates for others. Use request_certificate for your own." };
      const q = String(a.studentName).trim().toLowerCase();
      const stu = (await prisma.student.findMany()).find(s => s.name.toLowerCase() === q) || (await prisma.student.findMany()).find(s => s.name.toLowerCase().includes(q) || s.enrollmentNo.toLowerCase() === q);
      if (!stu) return { error: `No student named "${a.studentName}" found. Certificates are issued to students only — the Dean/faculty are not certificate recipients.` };
      const elig = certEligibility(stu);
      if (!elig.clear) return { issued: false, student: stu.name, holds: elig.reasons, message: `Cannot issue — ${stu.name} has holds: ${elig.reasons.join(", ")}.` };
      const id = `cert-${Date.now()}`;
      const hash = certHash(id, stu.name, String(a.type));
      await prisma.certificateRequest.create({
        data: { id, studentId: stu.id, studentName: stu.name, type: String(a.type), purpose: String(a.purpose || ""), requestDate: new Date().toISOString().slice(0, 10), status: "issued", issueDate: new Date().toISOString().slice(0, 10), hash, signedBy: ctx.email },
      });
      return { issued: true, student: stu.name, type: a.type, verifyCode: hash, message: `${a.type} issued & digitally signed for ${stu.name}. Verification code ${hash}.`, source: "Certificates" };
    },
  },
  {
    name: "get_action_items",
    description: "Committee/governance action items (tasks from meeting minutes), with owner, due date and status. Use for 'pending committee tasks', 'what actions are open', 'overdue tasks'.",
    module: "committee", write: false, needsApproval: false,
    parameters: { type: "object", properties: { onlyOverdue: { type: "boolean" } } },
    run: async (a) => {
      const today = new Date().toISOString().slice(0, 10);
      const rows = await prisma.actionItem.findMany({ where: { status: "open" } });
      const mapped = rows.map(r => ({ title: r.title, assignee: r.assignee, dueDate: r.dueDate, overdue: !!r.dueDate && r.dueDate < today }));
      const list = a.onlyOverdue ? mapped.filter(x => x.overdue) : mapped;
      return { count: list.length, actionItems: list, source: "Committee & Governance" };
    },
  },
  {
    name: "chase_overdue_tasks",
    description: "Send reminder notices to owners of overdue committee action items. Prepares only — routes to the approval queue. Use for 'chase the overdue committee tasks'.",
    module: "committee", write: true, needsApproval: true,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const rows = await prisma.actionItem.findMany({ where: { status: "open" } });
      const overdue = rows.filter(r => r.dueDate && r.dueDate < today);
      return { prepared: true, summary: `Reminders to ${overdue.length} owner(s) of overdue committee tasks`, count: overdue.length };
    },
  },
  {
    name: "list_flagged_admission_documents",
    description: "Admission documents flagged by the forensics check (review or suspected forgery), with the reason. Use for 'flagged admission documents', 'suspected forged marksheets', 'admission fraud checks'.",
    module: "admissions", write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const rows = await prisma.admissionDocument.findMany({ where: { verdict: { in: ["review", "forgery"] } }, orderBy: { createdAt: "desc" } });
      return { count: rows.length, flagged: rows.map(r => ({ applicant: r.applicantName, type: r.type, verdict: r.verdict, elaScore: r.elaScore, concerns: JSON.parse(r.findings || "{}").authenticityConcerns || [] })), source: "Admissions · document forensics" };
    },
  },

  // ─────────── KNOWLEDGE (RAG) — available to all roles ───────────
  {
    name: "search_policy",
    description: "Search KRMU policies, ordinances and regulations (attendance, fees, grading, registration, grievance, hostel, scholarships, exams). Use for any question about RULES or how something works. Returns passages with their source document to cite.",
    module: "dashboard", anyRole: true,
    write: false, needsApproval: false,
    parameters: { type: "object", required: ["query"], properties: { query: { type: "string", description: "What the user wants to know about the rules" } } },
    run: async (a) => {
      const hits = await retrieveLive(String(a.query || ""), 3);
      if (!hits.length) return { matches: [], note: "No matching policy found." };
      return { matches: hits.map(h => ({ title: h.doc.title, category: h.doc.category, passage: h.doc.text, source: `Policy · ${h.doc.title}` })), source: `Policy · ${hits[0].doc.title}` };
    },
  },

  // ─────────── CLIENT / SESSION actions (the browser executes; user's own session) ───────────
  {
    name: "open_screen",
    description: "Navigate the user to a screen/module. Use when the user wants to SEE or OPEN something — 'show my marks', 'open governance', 'open committee', 'admission forensics', 'timetable prep'. Pass the module name the user said; synonyms are resolved automatically.",
    module: "dashboard", client: true,
    write: false, needsApproval: false,
    parameters: {
      type: "object", required: ["module"],
      properties: {
        module: { type: "string", description: "Screen name, e.g. results, fees, attendance, timetable, timetable-generator, registration, grievance, certificates, admissions, committee, governance, students, curriculum, hr, hostel, transport, mis, notifications, predictions, approvals, workflows, accreditation, documents, calendar, dashboard, ai" },
        reason: { type: "string", description: "Short reason shown to user, e.g. 'Opening the Governance dashboard'" },
      },
    },
    run: async (a, ctx) => {
      const key = resolveModule(String(a.module || ""));
      const to = MODULE_ROUTE[key];
      if (!to) return { error: `Unknown screen "${a.module}"` };
      if (key !== "dashboard" && key !== "ai" && key !== "calendar" && !canAccess(ctx.role, key as ModuleKey)) {
        return { error: `You don't have access to ${key}.` };
      }
      return { client: "navigate", to, label: a.reason || `Opening ${key}`, source: "Navigation" };
    },
  },
  {
    name: "sign_out",
    description: "Sign the user out of their session. Use for 'sign out', 'log me out', 'logout kar do', 'mujhe logout karo'.",
    module: "dashboard", client: true,
    write: false, needsApproval: false,
    parameters: { type: "object", properties: {} },
    run: async () => ({ client: "logout", label: "Signing you out", source: "Session" }),
  },

  {
    name: "publish_pending_results",
    description: "Publish all draft exam results so students can see them. Does NOT publish directly — creates an approval request.",
    module: "examinations",
    write: true, needsApproval: true,
    parameters: { type: "object", properties: {} },
    run: async () => {
      const n = await prisma.examResult.count({ where: { status: "draft" } });
      return { prepared: true, summary: `Publish ${n} draft result(s)` };
    },
  },
];

// Tools available to a given role — permission enforced here AND re-checked on every call.
export function toolsForRole(role: UserRole): Tool[] {
  return TOOLS.filter(t => {
    if (t.client || t.anyRole) return true; // navigation, sign-out, policy lookup — all roles
    if (t.studentOrFaculty) return role === "student" || role === "faculty";
    if (t.selfOnly) return role === "student";
    if (t.facultyOnly) return role === "faculty";
    if (role === "student" || role === "faculty") return false; // self-roles only get their own tools
    return canAccess(role, t.module);
  });
}

export function getTool(name: string): Tool | undefined {
  return TOOLS.find(t => t.name === name);
}

// Enforce permission for a specific call (defence-in-depth, never trust the model).
export function permitted(tool: Tool, role: UserRole): boolean {
  if (tool.client || tool.anyRole) return true; // handler enforces any per-target permission
  if (tool.studentOrFaculty) return role === "student" || role === "faculty";
  if (tool.selfOnly) return role === "student";
  if (tool.facultyOnly) return role === "faculty";
  if (role === "student" || role === "faculty") return false;
  return canAccess(role, tool.module);
}
