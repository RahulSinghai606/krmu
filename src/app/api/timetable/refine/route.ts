import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/access";
import { generateTimetable, TTSpec } from "@/lib/timetable/engine";
import { applyEdits, EditOp } from "@/lib/timetable/edits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Parse an LLM Responses-API reply down to its text.
function extractText(data: Record<string, unknown>): string {
  if (typeof data.output_text === "string" && data.output_text) return data.output_text;
  const out = (data.output as unknown[]) || [];
  for (const item of out) {
    const it = item as Record<string, unknown>;
    const content = (it.content as unknown[]) || [];
    for (const c of content) {
      const cc = c as Record<string, unknown>;
      if (typeof cc.text === "string") return cc.text;
    }
  }
  return "";
}

function parseJSON(text: string): { ops: EditOp[]; summary: string } {
  let t = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const first = t.indexOf("{"); const last = t.lastIndexOf("}");
  if (first >= 0 && last > first) t = t.slice(first, last + 1);
  const obj = JSON.parse(t);
  return { ops: Array.isArray(obj.ops) ? obj.ops : [], summary: String(obj.summary || "") };
}

export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!(canAccess(s.role, "timetable") || s.role === "admin" || s.role === "registrar"))
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json();
  const spec = body.spec as TTSpec;
  const instruction = String(body.instruction || "").trim();
  if (!spec || !instruction) return NextResponse.json({ error: "spec and instruction required" }, { status: 400 });

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;
  const model = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5.4";
  if (!endpoint || !key) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const facultyList = Array.from(new Set(spec.subjects.map(x => x.faculty)));
  const sys = `You convert a plain-English timetable change request into a JSON list of edit operations for a university semester timetable. Reply with ONLY a JSON object, no prose.

Allowed operations (use the exact "type" strings):
- {"type":"set_credits","subject":"<name or code>","credits":N}
- {"type":"set_hours","subject":"<name or code>","hoursPerWeek":N}
- {"type":"replace_faculty","subject":"<name or code>","faculty":"<full name>"}
- {"type":"rename_subject","subject":"<name or code>","name":"<new name>"}
- {"type":"mark_unavailable","faculty":"<full name>","day":"Monday"}
- {"type":"clear_unavailable","faculty":"<full name>"}
- {"type":"remove_subject","subject":"<name or code>"}
- {"type":"add_subject","name":"<name>","faculty":"<name>","credits":N,"slotType":"lecture|lab|tutorial"}
- {"type":"set_target_credits","credits":N}

Current subjects: ${spec.subjects.map(x => `${x.name} (${x.code}, ${x.credits}cr, ${x.type}, ${x.faculty})`).join("; ")}
Faculty: ${facultyList.join(", ")}
Target credits: ${spec.targetCredits}.

Return: {"ops":[...], "summary":"one plain-English sentence describing the changes"}. If a subject/faculty is named loosely, match it to the closest existing one. If nothing is actionable, return {"ops":[],"summary":"No actionable change found"}.`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": key },
      body: JSON.stringify({
        model,
        input: [{ role: "system", content: sys }, { role: "user", content: instruction }],
        max_output_tokens: 1200,
      }),
    });
    if (!res.ok) return NextResponse.json({ error: `AI ${res.status}`, detail: await res.text() }, { status: 502 });
    const data = await res.json() as Record<string, unknown>;
    const text = extractText(data);
    let parsed: { ops: EditOp[]; summary: string };
    try { parsed = parseJSON(text); } catch { return NextResponse.json({ error: "Could not parse AI response", raw: text }, { status: 422 }); }

    const { spec: nextSpec, applied, skipped } = applyEdits(spec, parsed.ops);
    const result = generateTimetable(nextSpec);
    return NextResponse.json({ spec: nextSpec, result, ops: parsed.ops, applied, skipped, summary: parsed.summary });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
