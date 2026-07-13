"use client";
import { useState, useEffect, useMemo } from "react";
import { STUDENTS, COURSES } from "@/lib/data";
import type { Student } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store";
import { Skeleton } from "@/components/ui/Skeleton";
import { StudentSelfView } from "@/components/student/StudentSelfView";

type Status = "present" | "absent" | "leave";
const TODAY = "2025-01-22";
const MARK_COURSES = COURSES.filter(c => ["CSE301", "CSE302", "MA101"].includes(c.code));
const REPORT_COURSES = ["CSE301", "CSE302", "MA101"];

interface AttRec { studentId: string; courseCode: string; date: string; status: Status }

export default function AttendancePage() {
  const [view, setView] = useState<"mark"|"report"|"analytics">("mark");
  const [selectedCourse, setSelectedCourse] = useState("CSE301");
  const [date, setDate] = useState(TODAY);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [allRecords, setAllRecords] = useState<AttRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { user } = useApp();

  const roster: Student[] = useMemo(() => STUDENTS.filter(s => s.programme === "B.Tech CSE"), []);
  const course = COURSES.find(c => c.code === selectedCourse);

  // Load all records once (for report/analytics) + per-session marks.
  const loadAll = () => fetch("/api/attendance").then(r => r.json()).then(d => setAllRecords(d.records || [])).catch(() => {});

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    fetch(`/api/attendance?courseCode=${selectedCourse}&date=${date}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, Status> = {};
        roster.forEach(s => { map[s.id] = "present"; });
        (d.records || []).forEach((r: AttRec) => { map[r.studentId] = r.status; });
        setMarks(map);
      })
      .catch(() => {});
  }, [selectedCourse, date, roster]);

  const present = Object.values(marks).filter(v => v === "present").length;
  const leave = Object.values(marks).filter(v => v === "leave").length;
  const absent = roster.length - present - leave;

  const markAll = (status: Status) => setMarks(Object.fromEntries(roster.map(s => [s.id, status])));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse, courseName: course?.name, date,
          markedBy: user?.name || "Faculty", _actor: user?.email, _role: user?.role,
          entries: roster.map(s => ({ studentId: s.id, studentName: s.name, status: marks[s.id] || "present" })),
        }),
      });
      const data = await res.json();
      if (res.ok) { await loadAll(); toast.success("Attendance saved", `${selectedCourse} · ${date} · ${data.saved} students`); }
      else toast.error("Save failed", data.error);
    } catch { toast.error("Save failed", "Network error"); }
    finally { setSaving(false); }
  };

  // Report: per-student per-course present %
  const report = useMemo(() => {
    return roster.map(s => {
      const cols = REPORT_COURSES.map(cc => {
        const recs = allRecords.filter(r => r.studentId === s.id && r.courseCode === cc);
        if (!recs.length) return null;
        const p = recs.filter(r => r.status === "present").length;
        return Math.round((p / recs.length) * 100);
      });
      const valid = cols.filter((c): c is number => c != null);
      const overall = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : s.attendance;
      return { s, cols, overall };
    });
  }, [roster, allRecords]);

  const totalSessions = allRecords.length;
  const overallPct = totalSessions ? Math.round((allRecords.filter(r => r.status === "present").length / totalSessions) * 100) : 0;
  const belowCount = report.filter(r => r.overall < 75).length;

  const STATUS_BTN: Record<Status, string> = { present: "#0F9D58", leave: "#F5A623", absent: "#C8102E" };

  if (user?.role === "student") return <StudentSelfView view="attendance" />;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Attendance</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Even Semester 2024–25 · {totalSessions} sessions recorded · ● Live</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["mark","report","analytics"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className="btn cursor-hover"
                style={{ background: view === v ? "white" : "rgba(255,255,255,0.1)", color: view === v ? "#0A1628" : "rgba(255,255,255,0.6)", fontSize: 12.5, padding: "7px 14px", textTransform: "capitalize" }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {view === "mark" && (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: "100%", overflow: "hidden" }}>
            <div style={{ borderRight: "1px solid rgba(10,22,40,0.07)", background: "white", overflowY: "auto" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(10,22,40,0.06)" }}>
                <label className="field-label">Session Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="field-input" style={{ height: 36, fontSize: 13 }} />
              </div>
              {MARK_COURSES.map(c => (
                <button key={c.code} onClick={() => setSelectedCourse(c.code)} className="cursor-hover"
                  style={{ width: "100%", textAlign: "left", padding: "13px 20px", background: selectedCourse === c.code ? "rgba(21,101,192,0.05)" : "transparent", border: "none", borderBottom: "1px solid rgba(10,22,40,0.05)", borderLeft: selectedCourse === c.code ? "3px solid #1565C0" : "3px solid transparent" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0" }}>{c.code}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", marginTop: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{c.faculty}</div>
                </button>
              ))}
            </div>

            <div style={{ overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0" }}>{selectedCourse} · {date}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.03em", marginTop: 2 }}>{course?.name}</div>
                  <div style={{ fontSize: 13, color: "#737373", marginTop: 3 }}>{course?.faculty} · {roster.length} students enrolled</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6, padding: "6px 12px", background: "#F7F7F5", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: "#0F9D58" }}>✓ {present}</span><span style={{ color: "#A0AEC0" }}>·</span>
                    <span style={{ color: "#F5A623" }}>~ {leave}</span><span style={{ color: "#A0AEC0" }}>·</span>
                    <span style={{ color: "#C8102E" }}>✕ {absent}</span>
                  </div>
                  <button onClick={() => markAll("present")} className="btn btn-ghost btn-sm cursor-hover">All Present</button>
                  <button onClick={save} disabled={saving} className="btn btn-primary cursor-hover">{saving ? "Saving…" : "Save Attendance"}</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {roster.map(s => {
                  const status = marks[s.id] || "present";
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "white", borderRadius: 12, border: `1.5px solid ${status === "present" ? "rgba(15,157,88,0.2)" : status === "leave" ? "rgba(245,166,35,0.2)" : "rgba(200,16,46,0.15)"}` }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${STATUS_BTN[status]}, ${STATUS_BTN[status]}cc)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white" }}>
                        {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0A1628" }}>{s.name}</div>
                        <div style={{ fontSize: 11.5, color: "#737373" }}>{s.enrollmentNo} · Sem {s.semester} {s.section}</div>
                        <div style={{ fontSize: 11, color: s.attendance < 75 ? "#C8102E" : "#A0AEC0", marginTop: 2 }}>Overall: {s.attendance}%{s.attendance < 75 ? " ⚠ BELOW THRESHOLD" : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {(["present","leave","absent"] as const).map(st => (
                          <button key={st} onClick={() => setMarks(prev => ({ ...prev, [s.id]: st }))} className="cursor-hover"
                            style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, background: status === st ? STATUS_BTN[st] : "#F7F7F5", color: status === st ? "white" : "#737373", transition: "all 0.2s" }}>
                            {st === "present" ? "P" : st === "leave" ? "L" : "A"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === "report" && (
          <div style={{ padding: "24px 28px" }}>
            <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, fontSize: 18, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.03em" }}>Attendance Report — B.Tech CSE</div>
              <span style={{ fontSize: 12, color: "#737373" }}>Computed from {totalSessions} recorded sessions</span>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              {loading ? <div style={{ padding: 16 }}><Skeleton h={200} /></div> : (
                <table className="tbl">
                  <thead><tr><th>Student</th>{REPORT_COURSES.map(c => <th key={c}>{c}</th>)}<th>Overall</th><th>Status</th></tr></thead>
                  <tbody>
                    {report.map(({ s, cols, overall }) => (
                      <tr key={s.id}>
                        <td><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: "#A0AEC0" }}>{s.enrollmentNo}</div></td>
                        {cols.map((p, i) => (
                          <td key={i} style={{ fontWeight: 700, color: p == null ? "#C4C9D4" : p >= 85 ? "#0F9D58" : p >= 75 ? "#F5A623" : "#C8102E" }}>{p == null ? "—" : `${p}%`}</td>
                        ))}
                        <td style={{ fontWeight: 800, color: overall >= 85 ? "#0F9D58" : overall >= 75 ? "#F5A623" : "#C8102E" }}>{overall}%</td>
                        <td><span className={`chip ${overall >= 75 ? "chip-green" : "chip-red"}`}>{overall >= 75 ? "Eligible" : "Shortage"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {view === "analytics" && (
          <div style={{ padding: "24px 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Overall Present %", value: `${overallPct}%`, sub: "Across recorded sessions", color: "#1565C0" },
                { label: "Below 75%", value: String(belowCount), sub: "Students at shortage risk", color: "#C8102E" },
                { label: "Sessions Recorded", value: String(totalSessions), sub: "CSE301 · CSE302 · MA101", color: "#0F9D58" },
                { label: "Roster", value: String(roster.length), sub: "B.Tech CSE students", color: "#F5A623" },
              ].map(m => (
                <div key={m.label} className="card card-p">
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 8 }}>{m.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: 11.5, color: "#737373", marginTop: 6 }}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div className="card card-p">
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 16 }}>Course-wise Present Rate</div>
              {REPORT_COURSES.map(cc => {
                const recs = allRecords.filter(r => r.courseCode === cc);
                const pct = recs.length ? Math.round((recs.filter(r => r.status === "present").length / recs.length) * 100) : 0;
                return (
                  <div key={cc} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628", width: 80 }}>{cc}</span>
                    <div style={{ flex: 1, height: 18, background: "#F1F3F6", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct >= 85 ? "#0F9D58" : pct >= 75 ? "#F5A623" : "#C8102E", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>{pct}%</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#A0AEC0", width: 90, textAlign: "right" }}>{recs.length} records</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
