import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STUDENTS } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    // Students see only their own fee rows; finance/registrar/admin see all.
    if (s.role === "student") {
      const me = STUDENTS.find(x => x.enrollmentNo === s.studentId);
      const fees = await prisma.feeRecord.findMany({ where: { studentId: me?.id || "__none__" }, orderBy: { id: "asc" } });
      return NextResponse.json({ fees });
    }
    if (!["admin", "registrar", "finance", "dean"].includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    const fees = await prisma.feeRecord.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json({ fees });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** Record a payment against a fee record — real DB write, persists across reloads. */
export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const { id, amount, mode } = await req.json();
    if (!id || !amount || amount <= 0) {
      return NextResponse.json({ error: "id and positive amount required" }, { status: 400 });
    }
    const rec = await prisma.feeRecord.findUnique({ where: { id } });
    if (!rec) return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    // Students may only pay their own dues; finance/admin/registrar may record any.
    if (s.role === "student") {
      const me = STUDENTS.find(x => x.enrollmentNo === s.studentId);
      if (!me || rec.studentId !== me.id) return NextResponse.json({ error: "You can only pay your own fees" }, { status: 403 });
    } else if (!["admin", "registrar", "finance"].includes(s.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const paid = Math.min(rec.amount, rec.paid + amount);
    const due = rec.amount - paid;
    const status = due === 0 ? "paid" : "partial";
    const receiptNo = rec.receiptNo ?? `RCPT-2025-${String(Math.floor(60000 + paid % 40000)).slice(0, 5)}`;

    const updated = await prisma.feeRecord.update({
      where: { id },
      data: {
        paid, due, status, receiptNo,
        paymentMode: mode || "Online",
        paymentDate: new Date().toISOString().slice(0, 10),
      },
    });

    // Keep the student's denormalized feeDue in sync.
    await prisma.student.update({ where: { id: rec.studentId }, data: { feeDue: due } }).catch(() => {});

    return NextResponse.json({ fee: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
