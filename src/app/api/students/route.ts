import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF = ["admin", "registrar", "dean", "hod", "faculty", "finance", "exam_officer", "hostel_warden"];

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    const students = await prisma.student.findMany({ orderBy: { enrollmentNo: "asc" } });
    return NextResponse.json({ students });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

const REQUIRED = ["name", "enrollmentNo", "programme", "school", "email"] as const;

export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s || !["admin", "registrar"].includes(s.role)) return NextResponse.json({ error: "Only admin/registrar can admit students" }, { status: 403 });
  try {
    const b = await req.json();
    b._actor = s.email; b._role = s.role;
    for (const f of REQUIRED) {
      if (!b[f] || String(b[f]).trim() === "") {
        return NextResponse.json({ error: `Field "${f}" is required` }, { status: 400 });
      }
    }
    const dupe = await prisma.student.findUnique({ where: { enrollmentNo: b.enrollmentNo } });
    if (dupe) return NextResponse.json({ error: `Enrollment ${b.enrollmentNo} already exists` }, { status: 409 });

    const student = await prisma.student.create({
      data: {
        id: `s${Date.now().toString().slice(-6)}`,
        name: b.name, enrollmentNo: b.enrollmentNo, programme: b.programme,
        batch: b.batch || "2024-28", semester: Number(b.semester) || 1, section: b.section || "A",
        school: b.school, status: b.status || "enrolled",
        cgpa: Number(b.cgpa) || 0, attendance: Number(b.attendance) || 100, feeDue: Number(b.feeDue) || 0,
        phone: b.phone || "", email: b.email, guardianName: b.guardianName || "", guardianPhone: b.guardianPhone || "",
        address: b.address || "", dob: b.dob || "", category: b.category || "General",
        admissionDate: b.admissionDate || new Date().toISOString().slice(0, 10),
      },
    });
    await audit({ actor: b._actor, role: b._role, action: "Student admitted", module: "Students", detail: `${student.name} (${student.enrollmentNo})` });
    return NextResponse.json({ student });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
