import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { STUDENTS } from "@/lib/data";
import { classifyGrievance } from "@/lib/ai/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    // Students see only their own; staff see the full queue.
    const where = s.role === "student" ? { studentName: s.name } : {};
    const grievances = await prisma.grievance.findMany({ where, orderBy: { raisedDate: "desc" } });
    return NextResponse.json({ grievances });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Student raises a grievance → persists → appears in the staff queue immediately.
export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s || s.role !== "student") return NextResponse.json({ error: "Only students can raise grievances" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.subject || !b.description) return NextResponse.json({ error: "Subject and description required" }, { status: 400 });
    const me = STUDENTS.find(x => x.enrollmentNo === s.studentId);
    const count = await prisma.grievance.count();
    // Keyword classifier decides routing; the picked category from the form is a fallback only.
    const cls = classifyGrievance(`${b.subject} ${b.description}`);
    const category = cls.category !== "Other" ? cls.category : (b.category || "Other");
    const g = await prisma.grievance.create({
      data: {
        id: `g-${Date.now()}`,
        ticketNo: `KRMU-GRV-2025-${String(100 + count).padStart(4, "0")}`,
        studentId: me?.id || "s000", studentName: s.name,
        category, subject: b.subject, description: b.description,
        status: "open", priority: b.priority || "medium",
        assignedTo: cls.category !== "Other" ? cls.assignedTo : "Grievance Cell",
        raisedDate: new Date().toISOString().slice(0, 10),
        comments: JSON.stringify([]),
      },
    });
    await audit({ actor: s.email, role: s.role, action: "Grievance raised", module: "Grievance", detail: `${g.ticketNo} — ${g.subject}` });
    return NextResponse.json({ grievance: g });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
