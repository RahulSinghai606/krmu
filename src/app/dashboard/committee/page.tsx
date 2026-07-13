"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Sparkles, CheckSquare, Square, Gavel, ListTodo } from "lucide-react";

interface ActionItem { id: string; title: string; assignee: string; dueDate: string; status: string; }
interface Meeting { id: string; title: string; date: string; decisions: { id: string; text: string }[]; actionItems: ActionItem[]; }
interface Committee { id: string; name: string; meetings: Meeting[]; }

const SAMPLE = `Academic Council Meeting — 12 July 2026.
Present: Registrar, Dean SOET, HOD CSE, HOD ECE.
Discussed the revised elective basket for Semester 5 and lab infrastructure.
Resolved that Machine Learning will get one additional section from next term.
Decided to raise the internal assessment weightage from 30% to 40%.
Action: Dr. Rajeev Sharma to submit the revised ML syllabus by 25 July 2026.
Action: HOD ECE to procure 20 new oscilloscopes before 10 August 2026.
Action: Registrar office to publish the amended assessment policy by 20 July 2026.
Agenda for next meeting: NAAC criterion 2 evidence, hostel expansion.`;

export default function CommitteePage() {
  const { user } = useApp();
  const toast = useToast();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [title, setTitle] = useState("Academic Council Meeting");
  const [minutes, setMinutes] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const load = () => fetch("/api/committee").then(r => r.json()).then(d => setCommittees(d.committees || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const process = async () => {
    if (!minutes.trim()) return;
    setBusy(true);
    const res = await fetch("/api/committee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, minutesText: minutes, committeeName: "Academic Council" }) });
    const d = await res.json();
    setBusy(false);
    if (res.ok) { toast.success("Minutes processed", `${d.meeting.decisions.length} decisions · ${d.meeting.actionItems.length} tasks`); load(); }
    else toast.error("Failed", d.error);
  };

  const toggle = async (it: ActionItem) => {
    await fetch("/api/committee", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: it.id, status: it.status === "done" ? "open" : "done" }) });
    load();
  };

  const meetings = committees.flatMap(c => c.meetings.map(m => ({ ...m, committee: c.name })));

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="page-hero">
        <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Committee & Governance</span></div>
        <div className="page-hero-sub fade-up fade-up-1">Record minutes → AI segregates decisions, tasks & agenda → assign and chase to completion</div>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="card card-p">
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 10 }}>Record meeting minutes</div>
          <input className="field-input" style={{ height: 38, fontSize: 13, marginBottom: 10 }} value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting title" />
          <textarea className="field-input" style={{ minHeight: 150, fontSize: 13, padding: 12, lineHeight: 1.6, resize: "vertical" }} value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="Paste or type the raw minutes…" />
          <button onClick={process} disabled={busy} className="btn btn-primary cursor-hover" style={{ marginTop: 12, display: "flex", gap: 7, alignItems: "center" }}><Sparkles size={16} /> {busy ? "Processing…" : "Process with AI"}</button>
        </div>

        {meetings.length === 0 && <div className="card card-p" style={{ textAlign: "center", color: "#A0AEC0", padding: 32 }}>No processed meetings yet.</div>}

        {meetings.map(m => (
          <div key={m.id} className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)" }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0A1628" }}>{m.title}</div>
              <div style={{ fontSize: 11.5, color: "#A0AEC0" }}>{m.date}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 0 }}>
              <div style={{ padding: 18, borderRight: "1px solid rgba(10,22,40,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: "#1565C0", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}><Gavel size={14} /> Decisions</div>
                {m.decisions.length === 0 && <div style={{ fontSize: 12.5, color: "#A0AEC0" }}>None recorded.</div>}
                {m.decisions.map(d => <div key={d.id} style={{ fontSize: 13, color: "#374151", padding: "6px 0", borderBottom: "1px solid rgba(10,22,40,0.04)" }}>• {d.text}</div>)}
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: "#C77800", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}><ListTodo size={14} /> Action Items</div>
                {m.actionItems.length === 0 && <div style={{ fontSize: 12.5, color: "#A0AEC0" }}>None.</div>}
                {m.actionItems.map(it => {
                  const overdue = it.status === "open" && it.dueDate && it.dueDate < today;
                  return (
                    <div key={it.id} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "7px 0", borderBottom: "1px solid rgba(10,22,40,0.04)" }}>
                      <button onClick={() => toggle(it)} className="cursor-hover" style={{ background: "none", border: "none", color: it.status === "done" ? "#0F9D58" : "#A0AEC0", padding: 0, marginTop: 1 }}>{it.status === "done" ? <CheckSquare size={16} /> : <Square size={16} />}</button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: it.status === "done" ? "#A0AEC0" : "#0A1628", fontWeight: 600, textDecoration: it.status === "done" ? "line-through" : "none" }}>{it.title}</div>
                        <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>
                          {it.assignee}{it.dueDate ? ` · due ${it.dueDate}` : ""}
                          {overdue && <span style={{ color: "#C8102E", fontWeight: 700 }}> · OVERDUE</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11.5, color: "#A0AEC0" }}>Ask the AI: “what committee tasks are overdue?” or “chase the overdue committee tasks”.</div>
      </div>
    </div>
  );
}
