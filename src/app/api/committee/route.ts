import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { azureJSON } from "@/lib/ai/azure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF = ["admin", "registrar", "dean", "hod"];

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const committees = await prisma.committee.findMany({
    include: { meetings: { include: { decisions: true, actionItems: true }, orderBy: { date: "desc" } } },
  });
  const openTasks = await prisma.actionItem.findMany({ where: { status: "open" } });
  return NextResponse.json({ committees, openTaskCount: openTasks.length });
}

// Record + auto-process minutes: LLM segregates into decisions / action items / agenda.
export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const b = await req.json();
  const minutesText = String(b.minutesText || "").trim();
  if (!minutesText) return NextResponse.json({ error: "minutesText required" }, { status: 400 });

  // Ensure a committee exists (create ad-hoc if none chosen)
  let committeeId = b.committeeId as string | undefined;
  if (!committeeId) {
    const c = await prisma.committee.create({ data: { name: String(b.committeeName || "Ad-hoc Committee"), members: JSON.stringify([]) } });
    committeeId = c.id;
  }

  let parsed: { decisions: string[]; actionItems: { title: string; assignee: string; dueDate: string }[]; agenda: string[] };
  try {
    parsed = await azureJSON(
      `You are a committee secretary. From the meeting minutes, extract a JSON object:
{"decisions":[string], "actionItems":[{"title":string,"assignee":string,"dueDate":string}], "agenda":[string]}.
- decisions: resolutions/decisions taken.
- actionItems: concrete tasks with an owner (assignee, a person's name if stated else "Unassigned") and dueDate (ISO yyyy-mm-dd if a date is stated, else "").
- agenda: agenda/discussion topics.
Reply with ONLY the JSON object.`,
      minutesText,
    );
  } catch (e) {
    return NextResponse.json({ error: "Minutes extraction failed: " + String(e) }, { status: 502 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      committeeId, title: String(b.title || "Committee Meeting"),
      date: String(b.date || new Date().toISOString().slice(0, 10)),
      minutesText, processedAt: new Date().toISOString(),
      decisions: { create: (parsed.decisions || []).map(text => ({ text })) },
      actionItems: { create: (parsed.actionItems || []).map(a => ({ title: a.title, assignee: a.assignee || "Unassigned", dueDate: a.dueDate || "" })) },
    },
    include: { decisions: true, actionItems: true },
  });
  await audit({ actor: s.email, role: s.role, action: "Minutes processed", module: "Committee", detail: `${meeting.title}: ${meeting.decisions.length} decisions, ${meeting.actionItems.length} tasks`, byAi: true });
  return NextResponse.json({ meeting, agenda: parsed.agenda || [] });
}

// Toggle an action item done.
export async function PATCH(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const b = await req.json();
  const u = await prisma.actionItem.update({ where: { id: String(b.id) }, data: { status: b.status === "done" ? "done" : "open" } });
  return NextResponse.json({ actionItem: u });
}
