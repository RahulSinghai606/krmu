import { PrismaClient } from "@prisma/client";
import {
  STUDENTS, FACULTY, COURSES, FEE_RECORDS, GRIEVANCES,
  NOTIFICATIONS, TIMETABLE, HOSTEL_ROOMS, CERTIFICATE_REQUESTS,
} from "../src/lib/data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding KRMU ERP database…");

  // Clear (idempotent re-seed) — order respects FK constraints.
  await prisma.feeRecord.deleteMany();
  await prisma.grievance.deleteMany();
  await prisma.certificateRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.course.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.hostelRoom.deleteMany();

  await prisma.student.createMany({ data: STUDENTS });
  await prisma.faculty.createMany({ data: FACULTY });
  await prisma.course.createMany({ data: COURSES });
  await prisma.feeRecord.createMany({
    data: FEE_RECORDS.map(f => ({
      ...f,
      receiptNo: f.receiptNo ?? null,
      paymentDate: f.paymentDate ?? null,
      paymentMode: f.paymentMode ?? null,
    })),
  });
  await prisma.grievance.createMany({
    data: GRIEVANCES.map(g => ({
      ...g,
      resolvedDate: g.resolvedDate ?? null,
      comments: JSON.stringify(g.comments ?? []),
    })),
  });
  await prisma.notification.createMany({
    data: NOTIFICATIONS.map(n => ({ ...n, channels: JSON.stringify(n.channels) })),
  });
  await prisma.timetableSlot.createMany({ data: TIMETABLE });
  await prisma.hostelRoom.createMany({
    data: HOSTEL_ROOMS.map(r => ({ ...r, amenities: JSON.stringify(r.amenities) })),
  });
  await prisma.certificateRequest.createMany({
    data: CERTIFICATE_REQUESTS.map(c => ({ ...c, issueDate: c.issueDate ?? null })),
  });

  // ---- Synthetic operational data ----
  await prisma.attendanceRecord.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.auditLog.deleteMany();

  const now = new Date().toISOString();
  const cseStudents = STUDENTS.filter(s => s.programme === "B.Tech CSE");
  const attCourses = [
    { code: "CSE301", name: "Data Structures & Algorithms" },
    { code: "CSE302", name: "Database Management Systems" },
    { code: "MA101", name: "Engineering Mathematics I" },
  ];
  const dates = ["2025-01-13", "2025-01-14", "2025-01-15", "2025-01-16", "2025-01-17", "2025-01-20", "2025-01-21", "2025-01-22"];

  const attendance: any[] = [];
  cseStudents.forEach(s => {
    attCourses.forEach(c => {
      dates.forEach((d, i) => {
        // Deterministic: present unless this index falls in the "absent" band derived from the student's attendance %.
        const absentEvery = s.attendance >= 90 ? 99 : s.attendance >= 80 ? 6 : s.attendance >= 70 ? 4 : 3;
        const status = (i + c.code.length) % absentEvery === 0 ? (i % 2 === 0 ? "absent" : "leave") : "present";
        attendance.push({
          studentId: s.id, studentName: s.name, courseCode: c.code, courseName: c.name,
          date: d, status, markedBy: "Dr. Rajeev Sharma", createdAt: now,
        });
      });
    });
  });
  await prisma.attendanceRecord.createMany({ data: attendance });

  const examCourses = [
    { code: "CSE301", name: "Data Structures & Algorithms", sem: 3 },
    { code: "CSE302", name: "Database Management Systems", sem: 3 },
  ];
  const gradeOf = (t: number) => t >= 90 ? "O" : t >= 80 ? "A+" : t >= 70 ? "A" : t >= 60 ? "B+" : t >= 50 ? "B" : t >= 45 ? "C" : "F";
  const results: any[] = [];
  cseStudents.forEach(s => {
    examCourses.forEach(c => {
      const internal = Math.min(30, Math.round((s.cgpa / 10) * 30));
      const external = Math.min(70, Math.round((s.cgpa / 10) * 70) - (c.code === "CSE302" ? 3 : 0));
      const total = internal + external;
      results.push({
        studentId: s.id, studentName: s.name, courseCode: c.code, courseName: c.name,
        semester: c.sem, internal, external, total, grade: gradeOf(total),
        status: "published", updatedBy: "Mr. Vikas Chandra", updatedAt: now,
      });
    });
  });
  await prisma.examResult.createMany({ data: results });

  await prisma.registration.createMany({
    data: cseStudents.slice(0, 4).map((s, i) => ({
      studentId: s.id, studentName: s.name, programme: s.programme, semester: s.semester,
      courses: JSON.stringify(["CSE301", "CSE302", "CSE303", "MA101", "HS101"]),
      credits: 17,
      status: i === 0 ? "confirmed" : i === 1 ? "advisor_approved" : "submitted",
      submittedDate: "2025-01-21",
      approvedBy: i <= 1 ? "Dr. Rajeev Sharma" : null,
      remark: null,
    })),
  });

  // Seed institutional knowledge base (policies) into the queryable Policy table.
  await prisma.policy.deleteMany();
  const { KNOWLEDGE_BASE } = await import("../src/lib/ai/knowledge");
  await prisma.policy.createMany({ data: KNOWLEDGE_BASE.map(k => ({ id: k.id, title: k.title, category: k.category, text: k.text, updatedAt: now })) });

  await prisma.auditLog.createMany({
    data: [
      { actor: "rajeev.sharma@krmu.edu.in", role: "hod", action: "Marks published", module: "Examinations", detail: "CSE301 — 5 students", at: now },
      { actor: "finance@krmu.edu.in", role: "finance", action: "Payment recorded", module: "Fees", detail: "RCPT-2025-00451 · Priya Sharma", at: now },
      { actor: "registrar@krmu.edu.in", role: "registrar", action: "Certificate issued", module: "Certificates", detail: "Bonafide · Priya Sharma", at: now },
    ],
  });

  // ── Zero-Back-Office seed: holds, committee, admission forensics ──
  await prisma.actionItem.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.committee.deleteMany();
  await prisma.admissionDocument.deleteMany();
  await prisma.certificateRequest.deleteMany();

  // Give a couple of students holds so eligibility checks are demonstrable.
  await prisma.student.updateMany({ where: { enrollmentNo: "KRMU2024CSE002" }, data: { libraryDue: 1200 } });     // Arjun — library due
  await prisma.student.updateMany({ where: { enrollmentNo: "KRMU2023ECE045" }, data: { disciplinaryFlag: true } }); // Rohit — disciplinary hold

  // A processed committee meeting with decisions + action items (one overdue).
  const council = await prisma.committee.create({ data: { name: "Academic Council", members: JSON.stringify(["Registrar", "Dean SOET", "HOD CSE"]) } });
  await prisma.meeting.create({
    data: {
      committeeId: council.id, title: "Academic Council Meeting", date: "2026-07-05", processedAt: now,
      minutesText: "Reviewed Sem-5 electives and assessment weightage.",
      decisions: { create: [
        { text: "Machine Learning elective to get one additional section next term." },
        { text: "Internal assessment weightage raised from 30% to 40%." },
      ] },
      actionItems: { create: [
        { title: "Submit revised ML syllabus", assignee: "Dr. Rajeev Sharma", dueDate: "2026-07-10", status: "open" },   // overdue vs seed date
        { title: "Procure 20 oscilloscopes", assignee: "HOD ECE", dueDate: "2026-08-10", status: "open" },
        { title: "Publish amended assessment policy", assignee: "Registrar Office", dueDate: "2026-07-20", status: "open" },
      ] },
    },
  });

  // Admission forensics history (so the queue + AI 'flagged documents' have data pre-demo).
  await prisma.admissionDocument.createMany({
    data: [
      { id: "adm-1", applicantName: "Rohan Mehta", type: "marksheet", elaScore: 22, verdict: "clean", findings: JSON.stringify({ elaScore: 22, extracted: { name: "Rohan Mehta", board: "CBSE", percentage: "88%" }, authenticityConcerns: [], visualAnomalies: [] }), createdAt: now },
      { id: "adm-2", applicantName: "Sameer Khan", type: "marksheet", elaScore: 74, verdict: "forgery", findings: JSON.stringify({ elaScore: 74, extracted: { name: "Sameer Khan", board: "State Board", percentage: "94%" }, authenticityConcerns: ["marks field shows re-compression halo", "font of percentage differs from rest"], visualAnomalies: ["inconsistent fonts", "erased/overwritten regions"] }), createdAt: now },
    ],
  });

  const counts = {
    students: await prisma.student.count(),
    faculty: await prisma.faculty.count(),
    courses: await prisma.course.count(),
    fees: await prisma.feeRecord.count(),
    grievances: await prisma.grievance.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
