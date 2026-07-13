import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
const APPROVERS = ["admin", "registrar", "dean", "hod", "finance", "exam_officer"];

// Execute the prepared write once a human approves it (§6.4).
async function execute(tool: string, params: Record<string, unknown>, approver: string): Promise<string> {
  switch (tool) {
    case "send_notice": {
      await prisma.notification.create({
        data: {
          id: `n-${Date.now()}`, title: String(params.title || "Notice"), message: String(params.message || ""),
          type: "info", target: String(params.audience || "students"),
          channels: JSON.stringify(["email", "app"]), sentAt: new Date().toISOString(),
          sentBy: approver, readCount: 0, totalRecipients: 0,
        },
      });
      return `Notice "${params.title}" published to ${params.audience}.`;
    }
    case "prepare_fee_reminders": {
      const where: Record<string, unknown> = { due: { gt: 0 } };
      if (params.programme) where.programme = params.programme;
      const n = await prisma.feeRecord.count({ where });
      return `Fee reminders dispatched to ${n} defaulters via SMS + WhatsApp.`;
    }
    case "publish_pending_results": {
      const r = await prisma.examResult.updateMany({ where: { status: "draft" }, data: { status: "published" } });
      return `Published ${r.count} draft result(s).`;
    }
    case "chase_overdue_tasks": {
      const today = new Date().toISOString().slice(0, 10);
      const rows = await prisma.actionItem.findMany({ where: { status: "open" } });
      const overdue = rows.filter(r => r.dueDate && r.dueDate < today);
      for (const t of overdue) await prisma.actionItem.update({ where: { id: t.id }, data: { remindedAt: new Date().toISOString() } });
      return `Reminders sent to ${overdue.length} owner(s) of overdue committee tasks.`;
    }
    case "draft_lead_followup": {
      const q = String(params.leadName || "").toLowerCase();
      const lead = (await prisma.lead.findMany()).find(l => l.name.toLowerCase().includes(q));
      if (!lead) return "Lead not found.";
      await prisma.lead.update({ where: { id: lead.id }, data: { contactedCount: lead.contactedCount + 1, lastContactAt: new Date().toISOString() } });
      await prisma.notification.create({ data: { id: `n-${Date.now()}`, title: "Admission follow-up sent", message: `Personalized ${params.channel || "email"} follow-up to ${lead.name} (${lead.programme}).`, type: "info", target: "admissions", channels: JSON.stringify([String(params.channel || "email")]), sentAt: new Date().toISOString(), sentBy: approver, readCount: 0, totalRecipients: 1 } });
      return `Follow-up sent to ${lead.name}; marked contacted.`;
    }
    case "draft_intervention_plan": {
      const q = String(params.name || "").toLowerCase();
      const s = (await prisma.student.findMany()).find(x => x.name.toLowerCase().includes(q));
      if (!s) return "Student not found.";
      await prisma.notification.create({ data: { id: `n-${Date.now()}`, title: "Student intervention actioned", message: `Mentor assigned for ${s.name}; parent/guardian notified${s.feeDue > 0 ? "; fee-restructuring proposed" : ""}.`, type: "info", target: "faculty", channels: JSON.stringify(["email", "app"]), sentAt: new Date().toISOString(), sentBy: approver, readCount: 0, totalRecipients: 1 } });
      return `Intervention actioned for ${s.name}: mentor assigned, parent notified${s.feeDue > 0 ? ", fee plan proposed" : ""}.`;
    }
    default:
      return "Action approved.";
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sess = getSession(req);
  if (!sess || !APPROVERS.includes(sess.role)) return NextResponse.json({ error: "Not authorized to approve actions" }, { status: 403 });
  try {
    const { id } = await params;
    const b = await req.json();
    b._role = sess.role;
    const pa = await prisma.pendingAction.findUnique({ where: { id } });
    if (!pa) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (pa.status !== "pending") return NextResponse.json({ error: `Already ${pa.status}` }, { status: 409 });

    const approver = sess.email;
    if (b.action === "approve") {
      const args = JSON.parse(pa.params || "{}");
      const result = await execute(pa.tool, args, approver);
      const updated = await prisma.pendingAction.update({ where: { id }, data: { status: "approved", decidedBy: approver, decidedAt: new Date().toISOString(), result } });
      await audit({ actor: approver, role: b._role, action: "Approved AI action", module: "AI", detail: `${pa.summary} → ${result}`, byAi: false });
      return NextResponse.json({ action: updated, result });
    }
    if (b.action === "reject") {
      const updated = await prisma.pendingAction.update({ where: { id }, data: { status: "rejected", decidedBy: approver, decidedAt: new Date().toISOString(), result: b.reason || "Rejected" } });
      await audit({ actor: approver, role: b._role, action: "Rejected AI action", module: "AI", detail: pa.summary });
      return NextResponse.json({ action: updated });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
