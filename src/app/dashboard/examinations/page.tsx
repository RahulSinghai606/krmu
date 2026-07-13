"use client";
import { useState, useEffect } from "react";
import { EXAM_RESULTS_SUMMARY, UPCOMING_EXAMS, COURSES, STUDENTS } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { useApp } from "@/lib/store";
import { StudentSelfView } from "@/components/student/StudentSelfView";

const GRADE_HEX: Record<string, string> = { O: "#0F9D58", "A+": "#22A06B", A: "#1565C0", "B+": "#2E7BD6", B: "#F5A623", C: "#E8730A", F: "#C8102E" };
const getGradeColor = (g: string) => GRADE_HEX[g] || "#737373";

const GRADE_BANDS = [
  { grade: "O", range: "90-100", points: 10 },
  { grade: "A+", range: "80-89", points: 9 },
  { grade: "A", range: "70-79", points: 8 },
  { grade: "B+", range: "60-69", points: 7 },
  { grade: "B", range: "50-59", points: 6 },
  { grade: "C", range: "45-49", points: 5 },
  { grade: "F", range: "<45", points: 0 },
];

const gradeOf = (t: number) => t >= 90 ? "O" : t >= 80 ? "A+" : t >= 70 ? "A" : t >= 60 ? "B+" : t >= 50 ? "B" : t >= 45 ? "C" : "F";

export default function ExaminationsPage() {
  const { user } = useApp();
  // Faculty may only enter marks for the courses THEY teach; exam officer/admin get the exam set.
  const MARK_COURSES = user?.role === "faculty"
    ? COURSES.filter(c => c.faculty === user.name)
    : COURSES.filter(c => ["CSE301", "CSE302"].includes(c.code));

  const [tab, setTab] = useState<"schedule"|"results"|"marks">("schedule");
  const [courseCode, setCourseCode] = useState(MARK_COURSES[0]?.code || "CSE301");
  const [entries, setEntries] = useState<Record<string, { internal: string; external: string }>>({});
  const [resultStatus, setResultStatus] = useState<string>("draft");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const examStudents = STUDENTS.filter(s => s.programme === "B.Tech CSE");
  const course = MARK_COURSES.find(c => c.code === courseCode);

  useEffect(() => {
    fetch(`/api/exams?courseCode=${courseCode}`).then(r => r.json()).then(d => {
      const map: Record<string, { internal: string; external: string }> = {};
      let st = "draft";
      (d.results || []).forEach((r: { studentId: string; internal: number; external: number; status: string }) => {
        map[r.studentId] = { internal: String(r.internal), external: String(r.external) };
        st = r.status;
      });
      setEntries(map);
      setResultStatus((d.results || []).length ? st : "draft");
    }).catch(() => {});
  }, [courseCode]);

  const setMark = (id: string, field: "internal" | "external", v: string, max: number) => {
    const n = Math.min(max, parseInt(v.replace(/\D/g, "") || "0", 10));
    setEntries(p => ({ ...p, [id]: { internal: p[id]?.internal || "", external: p[id]?.external || "", [field]: v === "" ? "" : String(n) } }));
  };

  const saveMarks = async (publish: boolean) => {
    if (publish) {
      const ok = await confirm({ title: "Publish results?", message: `Results for ${courseCode} will become visible to students and locked from casual edits. Continue?`, confirmLabel: "Publish" });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode, courseName: course?.name, semester: course?.semester, status: publish ? "published" : "draft",
          updatedBy: user?.name || "Exam Officer", _actor: user?.email, _role: user?.role,
          entries: examStudents.map(s => ({ studentId: s.id, studentName: s.name, internal: entries[s.id]?.internal || 0, external: entries[s.id]?.external || 0 })),
        }),
      });
      const data = await res.json();
      if (res.ok) { setResultStatus(data.status); toast.success(publish ? "Results published" : "Marks saved", `${courseCode} · ${data.saved} students`); }
      else toast.error("Save failed", data.error);
    } catch { toast.error("Save failed", "Network error"); }
    finally { setSaving(false); }
  };

  if (user?.role === "student") return <StudentSelfView view="results" />;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Examinations & Evaluation</span></div>
            <div className="page-hero-sub fade-up fade-up-1">End Semester · January 2025 · Exam Cycle Active</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={async () => {
              const res = await fetch("/api/hallticket", { method: "POST" });
              const d = await res.json();
              if (res.ok) toast.success("Hall tickets released", `${d.eligible} eligible students notified — downloadable from My Results`);
              else toast.error("Failed", d.error);
            }} className="btn btn-gold btn-sm cursor-hover">Generate Hall Tickets</button>
            <button className="btn btn-sm cursor-hover" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>Publish Results</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Exams Scheduled", value: 24, color: "white" },
            { label: "Avg Pass Rate", value: "92.7%", color: "#0F9D58" },
            { label: "ATKT Cases", value: 59, color: "#F5A623" },
            { label: "Results Pending", value: 3, color: "#C8102E" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderBottom: "1px solid rgba(10,22,40,0.07)", padding: "0 24px", display: "flex", gap: 28, flexShrink: 0 }}>
        {([["schedule","Exam Schedule"],["results","Results & Analytics"],["marks","Marks Entry"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className="cursor-hover"
            style={{ padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none",
              color: tab === t ? "#0A1628" : "#737373",
              borderBottom: tab === t ? "2px solid #0A1628" : "2px solid transparent", transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {tab === "schedule" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead><tr><th>Subject</th><th>Code</th><th>Programme</th><th>Date</th><th>Time</th><th>Venue</th><th>Status</th></tr></thead>
              <tbody>
                {UPCOMING_EXAMS.map((e, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>{e.subject}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{e.code}</td>
                    <td style={{ fontSize: 12.5 }}>{e.programme}</td>
                    <td style={{ fontWeight: 700 }}>{formatDate(e.date)}</td>
                    <td style={{ fontSize: 12.5 }}>{e.time}</td>
                    <td style={{ fontSize: 12.5 }}>{e.room}</td>
                    <td><span className={`chip ${e.room.includes("Block-A") ? "chip-green" : "chip-amber"}`}>{e.room.includes("Block-A") ? "confirmed" : "tentative"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "results" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Programme-wise Result Summary</div>
              <table className="tbl">
                <thead><tr><th>Programme</th><th>Sem</th><th>Appeared</th><th>Passed</th><th>ATKT</th><th>Failed</th><th>Pass Rate</th><th></th></tr></thead>
                <tbody>
                  {EXAM_RESULTS_SUMMARY.map((r, i) => {
                    const pct = parseFloat(r.passRate);
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, fontSize: 13 }}>{r.programme}</td>
                        <td style={{ fontWeight: 700 }}>Sem {r.semester}</td>
                        <td>{r.appeared}</td>
                        <td style={{ color: "#0F9D58", fontWeight: 700 }}>{r.passed}</td>
                        <td style={{ color: "#F5A623", fontWeight: 700 }}>{r.atkt}</td>
                        <td style={{ color: "#C8102E", fontWeight: 700 }}>{r.failed}</td>
                        <td style={{ fontWeight: 800 }}>{r.passRate}</td>
                        <td style={{ width: 140 }}>
                          <div style={{ height: 6, background: "#EEF0F3", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 93 ? "#0F9D58" : pct >= 90 ? "#1565C0" : "#F5A623", borderRadius: 3 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="card card-p">
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 14 }}>Grading Scheme (UGC 10-Point CGPA)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
                {GRADE_BANDS.map(g => (
                  <div key={g.grade} style={{ textAlign: "center", padding: "12px 8px", background: "#F7F7F5", borderRadius: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: getGradeColor(g.grade), letterSpacing: "-0.04em" }}>{g.grade}</div>
                    <div style={{ fontSize: 10.5, color: "#737373", marginTop: 4 }}>{g.range}</div>
                    <div style={{ fontSize: 10, color: "#A0AEC0", marginTop: 2 }}>{g.points} pts</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "marks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select value={courseCode} onChange={e => setCourseCode(e.target.value)} className="field-input cursor-hover" style={{ width: 320, height: 38 }}>
                {MARK_COURSES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
              <span style={{ fontSize: 12, color: "#737373" }}>Internal 30 + External 70 · End Semester</span>
              <span className={`chip ${resultStatus === "published" ? "chip-green" : "chip-amber"}`} style={{ marginLeft: 4 }}>{resultStatus}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button onClick={() => saveMarks(false)} disabled={saving} className="btn btn-ghost btn-sm cursor-hover">{saving ? "Saving…" : "Save Draft"}</button>
                <button onClick={() => saveMarks(true)} disabled={saving} className="btn btn-primary btn-sm cursor-hover">Publish Results</button>
              </div>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="tbl">
                <thead><tr><th>Enrollment No</th><th>Student</th><th>Internal (30)</th><th>External (70)</th><th>Total</th><th>Grade</th></tr></thead>
                <tbody>
                  {examStudents.map(s => {
                    const e = entries[s.id] || { internal: "", external: "" };
                    const hasMarks = e.internal !== "" || e.external !== "";
                    const total = hasMarks ? (parseInt(e.internal || "0") + parseInt(e.external || "0")) : null;
                    const grade = total == null ? "—" : gradeOf(total);
                    return (
                      <tr key={s.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 11.5 }}>{s.enrollmentNo}</td>
                        <td style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</td>
                        <td>
                          <input value={e.internal} onChange={ev => setMark(s.id, "internal", ev.target.value, 30)}
                            placeholder="0" className="field-input" style={{ width: 64, height: 30, textAlign: "center", fontSize: 13 }} />
                        </td>
                        <td>
                          <input value={e.external} onChange={ev => setMark(s.id, "external", ev.target.value, 70)}
                            placeholder="0" className="field-input" style={{ width: 64, height: 30, textAlign: "center", fontSize: 13 }} />
                        </td>
                        <td style={{ fontWeight: 800 }}>{total ?? "—"}</td>
                        <td><span style={{ fontWeight: 800, color: getGradeColor(grade) }}>{grade}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
