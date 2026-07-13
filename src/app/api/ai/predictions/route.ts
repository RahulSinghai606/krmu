import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ENROLMENT_TREND, FEE_COLLECTION_MONTHLY } from "@/lib/data";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = ["admin", "registrar", "dean", "hod", "finance"];
function guard(req: NextRequest) {
  const s = getSession(req);
  return s && ALLOWED.includes(s.role) ? s : null;
}

// §6.1.3 Predictive intelligence — transparent, explainable scoring stored with inputs + basis + timestamp,
// labelled advisory, and back-testable (actual filled later).

const band = (s: number) => s >= 0.4 ? "high" : s >= 0.25 ? "medium" : "low";

async function computeAll() {
  const now = new Date().toISOString();
  const students = await prisma.student.findMany();
  const results = await prisma.examResult.findMany();
  const fees = await prisma.feeRecord.findMany();
  const rows: { kind: string; subjectId: string; subject: string; score: number; band: string; basis: string; confidence: number; at: string }[] = [];

  // 1) Dropout / at-risk per student
  for (const s of students) {
    const att = s.attendance < 75 ? (75 - s.attendance) / 75 : 0;
    const aca = s.cgpa < 6 ? (6 - s.cgpa) / 6 : 0;
    const fin = s.feeDue > 0 ? Math.min(1, s.feeDue / 100000) : 0;
    const score = +(att * 0.5 + aca * 0.3 + fin * 0.2).toFixed(2);
    if (score >= 0.15) rows.push({ kind: "dropout_risk", subjectId: s.id, subject: s.name, score, band: band(score), confidence: 0.72,
      basis: JSON.stringify({ attendance: s.attendance, cgpa: s.cgpa, feeDue: s.feeDue, weights: { attendance: 0.5, cgpa: 0.3, fees: 0.2 } }), at: now });
  }

  // 2) Attendance shortfall (trending toward <75)
  for (const s of students) {
    if (s.attendance >= 75 && s.attendance < 80) rows.push({ kind: "attendance_shortfall", subjectId: s.id, subject: s.name, score: +((80 - s.attendance) / 5).toFixed(2), band: "medium", confidence: 0.65,
      basis: JSON.stringify({ current: s.attendance, threshold: 75, note: "within 5% of breach" }), at: now });
  }

  // 3) Fee-collection forecast (institution)
  const collected = fees.reduce((x, f) => x + f.paid, 0);
  const due = fees.reduce((x, f) => x + f.due, 0);
  const projected = collected + Math.round(due * 0.7); // assume 70% of dues recovered
  rows.push({ kind: "fee_forecast", subjectId: "institution", subject: "Semester fee collection", score: projected, band: due > collected * 0.2 ? "at-risk" : "on-track", confidence: 0.6,
    basis: JSON.stringify({ collected, outstanding: due, recoveryAssumption: "70%", monthly: FEE_COLLECTION_MONTHLY }), at: now });

  // 4) Result-trend per programme
  const byProg: Record<string, { pass: number; total: number }> = {};
  results.forEach(r => { const e = byProg[r.courseCode.slice(0, 3)] ||= { pass: 0, total: 0 }; e.total++; if (r.total >= 45) e.pass++; });
  Object.entries(byProg).forEach(([p, v]) => rows.push({ kind: "result_trend", subjectId: p, subject: `${p} courses`, score: v.total ? +(v.pass / v.total).toFixed(2) : 0, band: v.pass / v.total >= 0.9 ? "healthy" : "watch", confidence: 0.55,
    basis: JSON.stringify({ passed: v.pass, appeared: v.total }), at: now }));

  // 5) Enrolment forecast (next year via trailing growth)
  const t = ENROLMENT_TREND;
  const g = t.length >= 2 ? (t[t.length - 1].students - t[t.length - 2].students) / t[t.length - 2].students : 0.05;
  const proj = Math.round(t[t.length - 1].students * (1 + g));
  rows.push({ kind: "enrolment", subjectId: "institution", subject: "Next-year enrolment", score: proj, band: g >= 0 ? "growth" : "decline", confidence: 0.5,
    basis: JSON.stringify({ lastYear: t[t.length - 1].students, growthRate: +(g * 100).toFixed(1) + "%", trend: t }), at: now });

  return rows;
}

export async function GET(req: NextRequest) {
  if (!guard(req)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    // History is retained across runs; show the LATEST run (by timestamp).
    const latest = await prisma.prediction.findFirst({ orderBy: { at: "desc" } });
    const all = latest ? await prisma.prediction.findMany({ where: { at: latest.at }, orderBy: { score: "desc" } }) : [];
    const runs = (await prisma.prediction.findMany({ distinct: ["at"], select: { at: true }, orderBy: { at: "desc" } })).length;
    const byKind: Record<string, typeof all> = {};
    all.forEach(p => { (byKind[p.kind] ||= []).push(p); });
    return NextResponse.json({ byKind, generatedAt: latest?.at || null, runsRetained: runs });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!guard(req)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  try {
    // Back-test: fill in the actual outcome for prior dropout-risk predictions before storing a new run.
    const prior = await prisma.prediction.findMany({ where: { kind: "dropout_risk", actual: null } });
    for (const p of prior) {
      const s = await prisma.student.findUnique({ where: { id: p.subjectId } }).catch(() => null);
      if (s) await prisma.prediction.update({ where: { id: p.id }, data: { actual: s.status === "withdrawn" ? "dropped" : "retained" } }).catch(() => {});
    }
    const rows = await computeAll(); // new run — history is NOT deleted, so runs can be back-tested over time
    await prisma.prediction.createMany({ data: rows });
    return NextResponse.json({ ok: true, generated: rows.length, backTested: prior.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
