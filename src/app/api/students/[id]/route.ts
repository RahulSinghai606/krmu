import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
const MANAGERS = ["admin", "registrar"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sess = getSession(req);
  if (!sess || !MANAGERS.includes(sess.role)) return NextResponse.json({ error: "Only admin/registrar can edit students" }, { status: 403 });
  try {
    const { id } = await params;
    const b = await req.json();
    b._actor = sess.email; b._role = sess.role;
    const allowed = ["name", "programme", "batch", "semester", "section", "school", "status", "cgpa", "attendance", "feeDue", "phone", "email", "guardianName", "guardianPhone", "address", "dob", "category"];
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (k in b) data[k] = ["semester", "cgpa", "attendance", "feeDue"].includes(k) ? Number(b[k]) : b[k];

    const student = await prisma.student.update({ where: { id }, data });
    await audit({ actor: b._actor, role: b._role, action: "Student updated", module: "Students", detail: `${student.name} (${student.enrollmentNo})` });
    return NextResponse.json({ student });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sess = getSession(req);
  if (!sess || !MANAGERS.includes(sess.role)) return NextResponse.json({ error: "Only admin/registrar can remove students" }, { status: 403 });
  try {
    const { id } = await params;
    const s = await prisma.student.findUnique({ where: { id } });
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Clean dependent rows first (SQLite has no cascade here).
    await prisma.feeRecord.deleteMany({ where: { studentId: id } });
    await prisma.grievance.deleteMany({ where: { studentId: id } });
    await prisma.student.delete({ where: { id } });
    await audit({ action: "Student removed", module: "Students", detail: `${s.name} (${s.enrollmentNo})` });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
