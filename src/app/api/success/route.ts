import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { scoreLead, callPriority, daysSince } from "@/lib/leads";
import { azureChat } from "@/lib/ai/azure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF = ["admin", "registrar", "dean", "finance", "exam_officer", "hod"];

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const view = req.nextUrl.searchParams.get("view") || "funnel";
  const now = Date.now();

  if (view === "funnel") {
    const leads = await prisma.lead.findMany();
    const by = (k: "stage" | "source" | "programme") => leads.reduce((m, l) => { m[l[k]] = (m[l[k]] || 0) + 1; return m; }, {} as Record<string, number>);
    const admitted = leads.filter(l => l.stage === "admitted").length;
    return NextResponse.json({ total: leads.length, byStage: by("stage"), bySource: by("source"), byProgramme: by("programme"), conversionPct: Math.round((admitted / leads.length) * 100) });
  }

  if (view === "calls") {
    const leads = await prisma.lead.findMany({ where: { stage: { in: ["enquiry", "application"] } } });
    const calls = leads.map(l => { const { score, reasons } = scoreLead(l, now); return { id: l.id, name: l.name, programme: l.programme, source: l.source, stage: l.stage, phone: l.phone, propensity: score, reasons, priority: callPriority({ ...l, score }, now), lastContacted: daysSince(l.lastContactAt, now) }; })
      .sort((a, b) => b.priority - a.priority);
    return NextResponse.json({ calls });
  }

  // cockpit — program health
  const students = await prisma.student.findMany();
  const results = await prisma.examResult.findMany({ where: { status: "published" } });
  const groups: Record<string, typeof students> = {};
  students.forEach(st => { (groups[st.programme] ||= []).push(st); });
  const rows = Object.entries(groups).map(([programme, list]) => {
    const atRisk = list.filter(st => st.attendance < 75 || st.cgpa < 6 || st.feeDue > 50000).length;
    const avgAtt = Math.round(list.reduce((x, st) => x + st.attendance, 0) / list.length);
    const dues = list.filter(st => st.feeDue > 0).length;
    const pr = results.filter(r => list.some(st => st.id === r.studentId));
    const passRate = pr.length ? Math.round(pr.filter(r => r.total >= 45).length / pr.length * 100) : null;
    const concerns = [avgAtt < 75 ? `avg attendance ${avgAtt}%` : null, atRisk ? `${atRisk} at-risk` : null, dues ? `${dues} with dues` : null, passRate !== null && passRate < 80 ? `pass ${passRate}%` : null].filter(Boolean) as string[];
    return { programme, enrolled: list.length, atRisk, avgAttendance: avgAtt, passRate, withDues: dues, healthScore: Math.max(0, 100 - atRisk * 12 - (avgAtt < 75 ? 15 : 0)), concerns };
  }).sort((a, b) => a.healthScore - b.healthScore);
  return NextResponse.json({ programmes: rows });
}

// Draft or send a lead follow-up.
export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const b = await req.json();
  const lead = await prisma.lead.findUnique({ where: { id: String(b.leadId) } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (b.action === "draft") {
    let draft = "";
    try {
      draft = await azureChat(
        "You write warm, concise, personalized admission follow-up messages for K.R. Mangalam University. 90 words max, one clear call to action. No placeholders.",
        `Lead: ${lead.name}, interested in ${lead.programme}, source ${lead.source}, stage ${lead.stage}. Channel: ${b.channel || "email"}.`, 500);
    } catch { draft = `Dear ${lead.name}, thank you for your interest in ${lead.programme} at K.R. Mangalam University. Our team would love to help you complete your application — may we call you this week?`; }
    return NextResponse.json({ draft });
  }

  if (b.action === "send") {
    await prisma.lead.update({ where: { id: lead.id }, data: { contactedCount: lead.contactedCount + 1, lastContactAt: new Date().toISOString() } });
    await prisma.notification.create({ data: { id: `n-${Date.now()}`, title: "Admission follow-up sent", message: `Follow-up to ${lead.name} (${lead.programme}).`, type: "info", target: "admissions", channels: JSON.stringify([b.channel || "email"]), sentAt: new Date().toISOString(), sentBy: s.email, readCount: 0, totalRecipients: 1 } });
    await audit({ actor: s.email, role: s.role, action: "Lead follow-up sent", module: "Admissions", detail: `${lead.name} · ${lead.programme}` });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
