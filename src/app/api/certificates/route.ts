import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { certEligibility, certHash } from "@/lib/certificates";
import { STUDENTS } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF = ["admin", "registrar", "dean", "exam_officer"];

async function studentFor(session: { role: string; email: string; studentId?: string }) {
  if (session.studentId) return prisma.student.findFirst({ where: { enrollmentNo: session.studentId } });
  const s = STUDENTS.find(x => x.email === session.email);
  return s ? prisma.student.findUnique({ where: { id: s.id } }) : null;
}

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (s.role === "student") {
    const me = await studentFor(s);
    const rows = me ? await prisma.certificateRequest.findMany({ where: { studentId: me.id }, orderBy: { requestDate: "desc" } }) : [];
    return NextResponse.json({ requests: rows });
  }
  const rows = await prisma.certificateRequest.findMany({ orderBy: { requestDate: "desc" } });
  return NextResponse.json({ requests: rows });
}

// Student files a request.
export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s || s.role !== "student") return NextResponse.json({ error: "Only students can request" }, { status: 403 });
  const me = await studentFor(s);
  if (!me) return NextResponse.json({ error: "No student record" }, { status: 404 });
  const b = await req.json();
  const elig = certEligibility(me);
  const row = await prisma.certificateRequest.create({
    data: {
      id: `cert-${Date.now()}`, studentId: me.id, studentName: me.name,
      type: String(b.type || "Bonafide Certificate"), purpose: String(b.purpose || ""),
      requestDate: new Date().toISOString().slice(0, 10),
      status: elig.clear ? "pending" : "on-hold",
      holdReasons: elig.clear ? null : JSON.stringify(elig.reasons),
    },
  });
  await audit({ actor: s.email, role: s.role, action: "Certificate requested", module: "Certificates", detail: `${row.type} — ${elig.clear ? "eligible" : "held: " + elig.reasons.join(", ")}` });
  return NextResponse.json({ request: row, eligibility: elig });
}

// Registrar issues (signs) or rejects. This is the human-approval step.
export async function PATCH(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const b = await req.json();
  const row = await prisma.certificateRequest.findUnique({ where: { id: String(b.id) } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (b.action === "reject") {
    const u = await prisma.certificateRequest.update({ where: { id: row.id }, data: { status: "rejected", holdReasons: JSON.stringify([b.reason || "Rejected by registrar"]) } });
    await audit({ actor: s.email, role: s.role, action: "Certificate rejected", module: "Certificates", detail: `${row.type} for ${row.studentName}` });
    return NextResponse.json({ request: u });
  }

  // issue: re-check eligibility at issue time
  const stu = await prisma.student.findUnique({ where: { id: row.studentId } });
  const elig = stu ? certEligibility(stu) : { clear: false, reasons: ["student record missing"] };
  if (!elig.clear) {
    const u = await prisma.certificateRequest.update({ where: { id: row.id }, data: { status: "on-hold", holdReasons: JSON.stringify(elig.reasons) } });
    return NextResponse.json({ request: u, blocked: true, reasons: elig.reasons });
  }
  const hash = certHash(row.id, row.studentName, row.type);
  const u = await prisma.certificateRequest.update({
    where: { id: row.id },
    data: { status: "issued", issueDate: new Date().toISOString().slice(0, 10), hash, signedBy: s.email },
  });
  await audit({ actor: s.email, role: s.role, action: "Certificate issued & signed", module: "Certificates", detail: `${row.type} for ${row.studentName} · verify code ${hash}` });
  return NextResponse.json({ request: u, hash });
}
