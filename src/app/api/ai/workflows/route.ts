import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { WORKFLOWS, getWorkflow } from "@/lib/ai/workflows";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF = ["admin", "registrar", "dean", "hod", "finance", "exam_officer"];

export async function GET() {
  return NextResponse.json({ workflows: WORKFLOWS.map(w => ({ key: w.key, name: w.name, description: w.description, needsInput: w.needsInput || [] })) });
}

export async function POST(req: NextRequest) {
  try {
    const sess = getSession(req);
    if (!sess) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const role = sess.role;
    if (!STAFF.includes(role)) return NextResponse.json({ error: "Agentic workflows are for administrative roles." }, { status: 403 });
    const b = await req.json();
    b.email = sess.email;
    const wf = getWorkflow(b.key);
    if (!wf) return NextResponse.json({ error: "Unknown workflow" }, { status: 404 });

    const t0 = Date.now();
    const result = await wf.run(b.input || {});

    // Each consequential step → a PendingAction (§6.4)
    const created: { id: string; summary: string }[] = [];
    for (const p of result.prepared) {
      const pa = await prisma.pendingAction.create({
        data: { createdAt: new Date().toISOString(), requestedBy: b.email || "ai", role, tool: p.tool, params: JSON.stringify(p.params), summary: p.summary, status: "pending" },
      });
      created.push({ id: pa.id, summary: pa.summary });
    }

    await audit({ actor: b.email, role, action: `Ran agent workflow: ${wf.name}`, module: "AI", detail: result.brief.replace(/\*/g, ""), byAi: true, prompt: `workflow:${wf.key}` });
    await prisma.aiEvent.create({
      data: { at: new Date().toISOString(), actor: b.email || "anon", role, kind: "agent", tool: wf.key, prompt: `Run workflow: ${wf.name}`, summary: result.brief.slice(0, 300).replace(/\*/g, ""), tokensIn: 0, tokensOut: 0, latencyMs: Date.now() - t0, grounded: true, refused: false },
    }).catch(() => {});

    return NextResponse.json({ brief: result.brief, findings: result.findings, prepared: created, sources: result.sources });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
