"use client";
import { useState, useEffect } from "react";
import { COURSES, STUDENTS } from "@/lib/data";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/utils";

interface Reg { id: string; studentId: string; studentName: string; programme: string; semester: number; courses: string; credits: number; status: string; submittedDate: string; approvedBy: string | null }

const STATUS_CHIP: Record<string, string> = { submitted: "chip-amber", advisor_approved: "chip-blue", confirmed: "chip-green", rejected: "chip-red" };
const STATUS_LABEL: Record<string, string> = { submitted: "Awaiting Advisor", advisor_approved: "Advisor Approved", confirmed: "Confirmed", rejected: "Rejected" };

const coreCourses = COURSES.filter(c => c.programme === "B.Tech CSE" && c.semester <= 3);
// Open electives a student adds to reach the 18-credit minimum (core alone = 17).
const ELECTIVES = [
  { id: "oe-da", code: "OE-DA01", name: "Open Elective: Data Analytics", credits: 3, type: "elective", semester: 3, programme: "B.Tech CSE", faculty: "Dr. Kavitha Reddy", contactHours: 36 },
  { id: "oe-dm", code: "OE-DM01", name: "Open Elective: Digital Marketing", credits: 3, type: "elective", semester: 3, programme: "B.Tech CSE", faculty: "Prof. Meena Joshi", contactHours: 36 },
  { id: "oe-es", code: "OE-ES01", name: "Open Elective: Environmental Science", credits: 2, type: "elective", semester: 3, programme: "B.Tech CSE", faculty: "Dr. Rohit Bhatnagar", contactHours: 24 },
];
const regCourses = [...coreCourses, ...ELECTIVES];

export default function RegistrationPage() {
  const [tab, setTab] = useState<"self"|"approvals">("self");
  const [selected, setSelected] = useState<string[]>(regCourses.filter(c => c.type === "core").map(c => c.id));
  const [regs, setRegs] = useState<Reg[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useApp();
  // Resolve the ACTUAL logged-in student (no hardcoding); fall back to first demo student only if unmatched.
  const ME = STUDENTS.find(s => s.enrollmentNo === user?.studentId) || STUDENTS[0];

  const credits = regCourses.filter(c => selected.includes(c.id)).reduce((s, c) => s + c.credits, 0);
  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const isStudent = user?.role === "student";
  // Students see only their own registration; staff approvers see the full queue.
  const load = () => {
    const url = isStudent ? `/api/registration?studentId=${ME.id}` : "/api/registration";
    return fetch(url).then(r => r.json()).then(d => setRegs(d.registrations || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [isStudent]);

  const myReg = regs.find(r => r.studentId === ME.id);
  const statusStep = myReg?.status === "confirmed" ? 5 : myReg?.status === "advisor_approved" ? 4 : myReg?.status === "submitted" ? 3 : 2;

  const steps = [
    { label: "Eligibility", done: true },
    { label: "Fee Clearance", done: true },
    { label: "Course Selection", done: statusStep > 3, active: statusStep === 3 || !myReg },
    { label: "Advisor Approval", done: statusStep > 4, active: statusStep === 4 },
    { label: "Confirmation", done: statusStep >= 5, active: statusStep === 5 },
  ];

  const submit = async () => {
    if (credits < 18 || credits > 26) { toast.error("Invalid credit load", "Must be between 18 and 26"); return; }
    setSubmitting(true);
    try {
      const codes = regCourses.filter(c => selected.includes(c.id)).map(c => c.code);
      const res = await fetch("/api/registration", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: ME.id, studentName: ME.name, programme: ME.programme, semester: ME.semester, courses: codes, credits, _actor: user?.email, _role: user?.role }),
      });
      const data = await res.json();
      if (res.ok) { await load(); toast.success("Registration submitted", "Sent to advisor for approval"); }
      else toast.error("Submit failed", data.error);
    } catch { toast.error("Submit failed", "Network error"); }
    finally { setSubmitting(false); }
  };

  const act = async (reg: Reg, action: "approve"|"confirm"|"reject") => {
    if (action === "reject") {
      const ok = await confirm({ title: "Reject registration?", message: `${reg.studentName}'s registration will be sent back for revision.`, confirmLabel: "Reject", danger: true });
      if (!ok) return;
    }
    const res = await fetch(`/api/registration/${reg.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, by: user?.name || "Approver", _actor: user?.email, _role: user?.role }),
    });
    const data = await res.json();
    if (res.ok) { await load(); toast.success(`Registration ${action}d`, reg.studentName); }
    else toast.error("Action failed", data.error);
  };

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Semester Registration</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Even Semester 2024–25 · Window closes Feb 5 · {regs.filter(r => r.status === "confirmed").length} confirmed</div>
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderBottom: "1px solid rgba(10,22,40,0.07)", padding: "0 24px", display: "flex", gap: 28, flexShrink: 0 }}>
        {(isStudent
          ? ([["self", "My Registration"]] as const)
          : ([["self", "My Registration"], ["approvals", `Approvals Queue (${regs.filter(r => r.status !== "confirmed" && r.status !== "rejected").length})`]] as const)
        ).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className="cursor-hover"
            style={{ padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none", color: tab === t ? "#0A1628" : "#737373", borderBottom: tab === t ? "2px solid #0A1628" : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {tab === "self" && (
          <>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
              {steps.map((s, i) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "0 0 auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800,
                      background: s.done ? "#0F9D58" : s.active ? "#0A1628" : "#EEF0F3", color: s.done || s.active ? "white" : "#A0AEC0",
                      boxShadow: s.active ? "0 0 0 4px rgba(10,22,40,0.1)" : "none" }}>{s.done ? "✓" : i + 1}</div>
                    <span style={{ fontSize: 11, fontWeight: s.active ? 700 : 500, color: s.active ? "#0A1628" : "#A0AEC0", whiteSpace: "nowrap" }}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: s.done ? "#0F9D58" : "#EEF0F3", margin: "0 8px", marginBottom: 18 }} />}
                </div>
              ))}
            </div>

            {myReg && myReg.status !== "rejected" ? (
              <div className="card card-p" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: myReg.status === "confirmed" ? "rgba(15,157,88,0.1)" : "rgba(21,101,192,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={myReg.status === "confirmed" ? "#0F9D58" : "#1565C0"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{STATUS_LABEL[myReg.status]}</div>
                <p style={{ fontSize: 13.5, color: "#737373", marginTop: 8, lineHeight: 1.5 }}>
                  {ME.name}&apos;s Semester {myReg.semester} registration · {JSON.parse(myReg.courses).length} courses · {myReg.credits} credits.
                  {myReg.status === "submitted" && " Awaiting advisor approval."}
                  {myReg.status === "advisor_approved" && " Approved by advisor, awaiting registrar confirmation."}
                  {myReg.status === "confirmed" && " You are fully registered for this semester."}
                </p>
                <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                  {JSON.parse(myReg.courses).map((c: string) => <span key={c} className="chip chip-blue">{c}</span>)}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
                <div className="card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>
                    Select Courses — {ME.name} · {ME.programme}
                  </div>
                  {regCourses.map(c => {
                    const on = selected.includes(c.id);
                    const locked = c.type === "core";
                    return (
                      <div key={c.id} onClick={() => !locked && toggle(c.id)} className={locked ? "" : "cursor-hover"}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid rgba(10,22,40,0.05)", opacity: locked ? 0.85 : 1 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: on ? "none" : "2px solid rgba(10,22,40,0.2)", background: on ? "#0A1628" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#A0AEC0", fontFamily: "monospace" }}>{c.code} · {c.faculty}</div>
                        </div>
                        <span className={`chip ${c.type === "core" ? "chip-blue" : "chip-amber"}`}>{locked ? "mandatory" : c.type}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0A1628", width: 30, textAlign: "right" }}>{c.credits}<span style={{ fontSize: 9, color: "#A0AEC0" }}>cr</span></span>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className="card card-p">
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 16 }}>Registration Summary</div>
                    {[["Courses selected", selected.length], ["Total credits", `${credits} / 18–26`]].map(([l, v]) => (
                      <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(10,22,40,0.05)" }}>
                        <span style={{ fontSize: 13, color: "#737373" }}>{l}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: l === "Total credits" && (credits < 18 || credits > 26) ? "#C8102E" : "#0A1628" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                      <span style={{ fontSize: 13, color: "#737373" }}>Fee status</span><span className="chip chip-green">Cleared</span>
                    </div>
                    <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, background: credits >= 18 && credits <= 26 ? "rgba(15,157,88,0.08)" : "rgba(200,16,46,0.07)", fontSize: 12, color: credits >= 18 && credits <= 26 ? "#0F7B45" : "#C8102E", lineHeight: 1.4 }}>
                      {credits >= 18 && credits <= 26 ? "✓ Credit load within permitted range." : credits < 18 ? "⚠ Minimum 18 credits required." : "⚠ Maximum 26 credits."}
                    </div>
                    <button onClick={submit} disabled={submitting || credits < 18 || credits > 26} className="btn btn-primary cursor-hover" style={{ width: "100%", marginTop: 14, opacity: credits >= 18 && credits <= 26 ? 1 : 0.5 }}>
                      {submitting ? "Submitting…" : "Submit for Approval"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "approvals" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead><tr><th>Student</th><th>Programme</th><th>Sem</th><th>Courses</th><th>Credits</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {regs.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "#A0AEC0", padding: 32 }}>No registrations yet.</td></tr>}
                {regs.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>{r.studentName}</td>
                    <td style={{ fontSize: 12.5 }}>{r.programme}</td>
                    <td style={{ fontWeight: 700 }}>Sem {r.semester}</td>
                    <td style={{ fontSize: 12 }}>{JSON.parse(r.courses).length} courses</td>
                    <td style={{ fontWeight: 700 }}>{r.credits}</td>
                    <td style={{ fontSize: 12, color: "#737373" }}>{formatDate(r.submittedDate)}</td>
                    <td><span className={`chip ${STATUS_CHIP[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        {r.status === "submitted" && <button onClick={() => act(r, "approve")} className="btn btn-sm btn-blue cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Approve</button>}
                        {r.status === "advisor_approved" && <button onClick={() => act(r, "confirm")} className="btn btn-sm cursor-hover" style={{ padding: "4px 10px", fontSize: 11, background: "#0F9D58", color: "white" }}>Confirm</button>}
                        {(r.status === "submitted" || r.status === "advisor_approved") && <button onClick={() => act(r, "reject")} className="btn btn-sm btn-ghost cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Reject</button>}
                        {(r.status === "confirmed" || r.status === "rejected") && <span style={{ fontSize: 11, color: "#A0AEC0" }}>{r.approvedBy || "—"}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
