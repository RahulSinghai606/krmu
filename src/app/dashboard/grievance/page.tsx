"use client";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { Modal } from "@/components/ui/Modal";

interface G { id: string; ticketNo: string; studentName: string; category: string; subject: string; description: string; status: string; priority: string; assignedTo: string; raisedDate: string; resolvedDate?: string | null; comments: string }

const STATUS_CHIP: Record<string, string> = { open: "chip-blue", "in-progress": "chip-amber", resolved: "chip-green", closed: "chip-gray" };
const PRIORITY_COLOR: Record<string, string> = { urgent: "#C8102E", high: "#F5A623", medium: "#1565C0", low: "#737373" };
const CATEGORIES = ["Academic", "Fee", "Hostel", "Administrative", "Other"];

export default function GrievancePage() {
  const { user } = useApp();
  const toast = useToast();
  const confirm = useConfirm();
  const isStudent = user?.role === "student";

  const [rows, setRows] = useState<G[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("all");
  const [comment, setComment] = useState("");
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [form, setForm] = useState({ category: "Academic", priority: "medium", subject: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/grievances").then(r => r.json()).then(d => setRows(d.grievances || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const list = rows.filter(g => filter === "all" || g.status === filter);
  const active = rows.find(g => g.id === selectedId) || list[0] || rows[0];
  const counts = { open: rows.filter(g => g.status === "open").length, progress: rows.filter(g => g.status === "in-progress").length, resolved: rows.filter(g => g.status === "resolved").length };
  const activeComments: string[] = active ? (() => { try { return JSON.parse(active.comments || "[]"); } catch { return []; } })() : [];

  const raise = async () => {
    if (!form.subject.trim() || !form.description.trim()) { toast.error("Missing fields", "Subject and description are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/grievances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { await load(); setSelectedId(data.grievance.id); toast.success("Grievance raised", `${data.grievance.ticketNo} — routed to ${data.grievance.assignedTo}`); setRaiseOpen(false); setForm({ category: "Academic", priority: "medium", subject: "", description: "" }); }
      else toast.error("Failed", data.error);
    } catch { toast.error("Failed", "Network error"); } finally { setSaving(false); }
  };

  const decide = async (action: "resolve" | "comment") => {
    if (!active) return;
    if (action === "comment" && !comment.trim()) return;
    if (action === "resolve") { const ok = await confirm({ title: "Mark resolved?", message: active.subject, confirmLabel: "Resolve" }); if (!ok) return; }
    const res = await fetch(`/api/grievances/${active.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "resolve" ? { action: "resolve" } : { comment }) });
    if (res.ok) { setComment(""); await load(); toast.success(action === "resolve" ? "Resolved" : "Comment added"); }
    else toast.error("Failed");
  };

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">{isStudent ? "My Grievances" : "Grievance & Disciplinary"}</span></div>
            <div className="page-hero-sub fade-up fade-up-1">{isStudent ? "Raise and track your own tickets" : `${counts.open + counts.progress} active cases · live queue`}</div>
          </div>
          {isStudent && <button onClick={() => setRaiseOpen(true)} className="btn btn-gold btn-sm cursor-hover">+ Raise Ticket</button>}
        </div>
        {!isStudent && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
            {[["Open", counts.open, "#1565C0"], ["In Progress", counts.progress, "#F5A623"], ["Resolved", counts.resolved, "#0F9D58"]].map(([l, v, c]) => (
              <div key={l as string} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c as string, letterSpacing: "-0.04em", lineHeight: 1 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div style={{ width: 420, borderRight: "1px solid rgba(10,22,40,0.07)", display: "flex", flexDirection: "column", background: "white" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(10,22,40,0.06)", display: "flex", gap: 6 }}>
            {["all", "open", "in-progress", "resolved"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className="cursor-hover" style={{ padding: "5px 11px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, border: "none", textTransform: "capitalize", background: filter === f ? "#0A1628" : "#F7F7F5", color: filter === f ? "white" : "#525252" }}>{f === "in-progress" ? "Active" : f}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {list.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#A0AEC0", fontSize: 13 }}>{isStudent ? "No tickets yet. Raise one above." : "No grievances."}</div>}
            {list.map(g => (
              <button key={g.id} onClick={() => setSelectedId(g.id)} className="cursor-hover" style={{ width: "100%", textAlign: "left", padding: "14px 16px", border: "none", borderBottom: "1px solid rgba(10,22,40,0.05)", borderLeft: active?.id === g.id ? "3px solid #F5A623" : "3px solid transparent", background: active?.id === g.id ? "rgba(245,166,35,0.05)" : "transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10.5, color: "#A0AEC0" }}>{g.ticketNo}</span>
                  <span className={`chip ${STATUS_CHIP[g.status]}`} style={{ fontSize: 9.5 }}>{g.status}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", lineHeight: 1.3 }}>{g.subject}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: PRIORITY_COLOR[g.priority] }} />
                  <span style={{ fontSize: 11, color: "#737373" }}>{isStudent ? g.category : `${g.studentName} · ${g.category}`}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {!active ? (
            <div style={{ textAlign: "center", color: "#A0AEC0", paddingTop: 80, fontSize: 14 }}>{isStudent ? "Raise a ticket to get started." : "Select a grievance."}</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: "#A0AEC0", marginBottom: 6 }}>{active.ticketNo}</div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.03em", lineHeight: 1.15 }}>{active.subject}</h2>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <span className={`chip ${STATUS_CHIP[active.status]}`}>{active.status}</span>
                    <span className="chip" style={{ background: `${PRIORITY_COLOR[active.priority]}15`, color: PRIORITY_COLOR[active.priority] }}>{active.priority}</span>
                    <span className="chip chip-gray">{active.category}</span>
                  </div>
                </div>
                {!isStudent && active.status !== "resolved" && <button onClick={() => decide("resolve")} className="btn btn-primary btn-sm cursor-hover">Mark Resolved</button>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                {[["Raised By", active.studentName], ["Assigned To", active.assignedTo], ["Raised On", formatDate(active.raisedDate)]].map(([l, v]) => (
                  <div key={l} style={{ padding: "12px 14px", background: "#F7F7F5", borderRadius: 10 }}>
                    <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div className="card card-p" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Description</div>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{active.description}</p>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "#0A1628", marginBottom: 12 }}>Activity</div>
              <div style={{ position: "relative", paddingLeft: 22 }}>
                <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: 2, background: "rgba(10,22,40,0.08)" }} />
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <div style={{ position: "absolute", left: -22, top: 2, width: 14, height: 14, borderRadius: "50%", background: "#1565C0", border: "3px solid white", boxShadow: "0 0 0 1px rgba(10,22,40,0.1)" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>Ticket raised</div>
                  <div style={{ fontSize: 11.5, color: "#737373" }}>{formatDate(active.raisedDate)} by {active.studentName}</div>
                </div>
                {activeComments.map((c, i) => (
                  <div key={i} style={{ position: "relative", marginBottom: 16 }}>
                    <div style={{ position: "absolute", left: -22, top: 2, width: 14, height: 14, borderRadius: "50%", background: "#F5A623", border: "3px solid white", boxShadow: "0 0 0 1px rgba(10,22,40,0.1)" }} />
                    <div style={{ fontSize: 13.5, color: "#374151" }}>{c}</div>
                    <div style={{ fontSize: 11, color: "#A0AEC0" }}>{active.assignedTo}</div>
                  </div>
                ))}
                {active.resolvedDate && (
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -22, top: 2, width: 14, height: 14, borderRadius: "50%", background: "#0F9D58", border: "3px solid white", boxShadow: "0 0 0 1px rgba(10,22,40,0.1)" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F9D58" }}>Resolved · {formatDate(active.resolvedDate)}</div>
                  </div>
                )}
              </div>

              {!isStudent && active.status !== "resolved" && (
                <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
                  <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment or update…" className="field-input cursor-hover" style={{ flex: 1, height: 40 }} />
                  <button onClick={() => decide("comment")} className="btn btn-primary cursor-hover">Post</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal open={raiseOpen} onClose={() => !saving && setRaiseOpen(false)} title="Raise a Grievance" subtitle="It routes straight to the responsible office"
        footer={<><button onClick={() => setRaiseOpen(false)} className="btn btn-ghost cursor-hover">Cancel</button><button onClick={raise} disabled={saving} className="btn btn-primary cursor-hover">{saving ? "Submitting…" : "Submit"}</button></>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label className="field-label">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="field-input" style={{ height: 38 }}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="field-label">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="field-input" style={{ height: 38 }}>{["low", "medium", "high", "urgent"].map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div><label className="field-label">Subject</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="field-input" style={{ height: 38 }} placeholder="Brief summary" /></div>
          <div><label className="field-label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="field-input" style={{ resize: "vertical", paddingTop: 10 }} placeholder="Describe the issue…" /></div>
        </div>
      </Modal>
    </div>
  );
}
