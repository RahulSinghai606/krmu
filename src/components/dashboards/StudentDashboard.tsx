"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { TIMETABLE } from "@/lib/data";
import { Skeleton } from "@/components/ui/Skeleton";
import { BriefingCard } from "@/components/dashboards/BriefingCard";

interface MeData {
  kind: string;
  student?: { id: string; name: string; enrollmentNo: string; programme: string; semester: number; section: string; cgpa: number; status: string };
  results?: { courseCode: string; courseName: string; internal: number; external: number; total: number; grade: string; status: string }[];
  attendance?: { code: string; name: string; pct: number; attended: number; total: number }[];
  overallAtt?: number;
  totalDue?: number;
  registration?: { status: string; semester: number } | null;
  weakest?: { courseName: string; total: number; grade: string } | null;
}

const GRADE_HEX: Record<string, string> = { O: "#0F9D58", "A+": "#22A06B", A: "#1565C0", "B+": "#2E7BD6", B: "#F5A623", C: "#E8730A", F: "#C8102E" };

export function StudentDashboard() {
  const { user, toggleAIPanel } = useApp();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/me?email=${encodeURIComponent(user.email)}`).then(r => r.json()).then(setMe).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const s = me?.student;
  const section = s ? `${s.programme}-${s.section}` : "B.Tech CSE-A";
  const myClasses = TIMETABLE.filter(t => t.section === section);
  const byDay = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => ({ day: d, slots: myClasses.filter(c => c.day === d) }));

  const regLabel: Record<string, string> = { submitted: "Awaiting approval", advisor_approved: "Advisor approved", confirmed: "Confirmed", rejected: "Action needed" };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="page-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Hello, {(user?.name || "Student").split(" ")[0]}</span></div>
          <div className="page-hero-sub fade-up fade-up-1">
            {s ? `${s.enrollmentNo} · ${s.programme} · Semester ${s.semester}, Section ${s.section}` : "Your personalized student dashboard"}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <BriefingCard />
        {/* Personalized AI insight */}
        {me?.weakest && (
          <div className="card card-p" style={{ marginBottom: 22, borderLeft: "3px solid #F5A623", background: "rgba(245,166,35,0.05)", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg, #1565C0, #F5A623)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.01em" }}>AI Insight — focus on {me.weakest.courseName}</div>
              <div style={{ fontSize: 12.5, color: "#525252", marginTop: 3 }}>
                It&apos;s your lowest result this semester at <strong>{me.weakest.total}/100 (grade {me.weakest.grade})</strong>. {me.overallAtt != null && me.overallAtt < 75 ? "Your attendance is also below the 75% threshold — clear it before exams." : "Booking a doubt-clearing session could lift your CGPA."}
              </div>
            </div>
            <button onClick={toggleAIPanel} className="btn btn-gold btn-sm cursor-hover">Ask AI</button>
          </div>
        )}

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 22 }}>
          {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card card-p"><Skeleton h={60} /></div>) : [
            { label: "Current CGPA", value: s?.cgpa?.toFixed(1) ?? "—", sub: "Cumulative", color: (s?.cgpa ?? 0) >= 8 ? "#0F9D58" : (s?.cgpa ?? 0) >= 6 ? "#F5A623" : "#C8102E" },
            { label: "Attendance", value: `${me?.overallAtt ?? 0}%`, sub: (me?.overallAtt ?? 0) >= 75 ? "Eligible for exams" : "⚠ Below 75% threshold", color: (me?.overallAtt ?? 0) >= 85 ? "#0F9D58" : (me?.overallAtt ?? 0) >= 75 ? "#F5A623" : "#C8102E" },
            { label: "Fee Due", value: me?.totalDue ? `₹${(me.totalDue / 1000).toFixed(0)}K` : "Nil", sub: me?.totalDue ? "Pay before Jan 31" : "All cleared", color: me?.totalDue ? "#C8102E" : "#0F9D58" },
            { label: "Registration", value: me?.registration ? regLabel[me.registration.status] : "Pending", sub: me?.registration ? `Semester ${me.registration.semester}` : "Not submitted", color: me?.registration?.status === "confirmed" ? "#0F9D58" : "#F5A623" },
          ].map(c => (
            <div key={c.label} className="card card-p">
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 11.5, color: "#737373", marginTop: 6 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          {/* My results */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>My Results</div>
            {loading ? <div style={{ padding: 16 }}><Skeleton h={120} /></div> : (
              <table className="tbl">
                <thead><tr><th>Course</th><th>Int</th><th>Ext</th><th>Total</th><th>Grade</th></tr></thead>
                <tbody>
                  {(me?.results || []).length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#A0AEC0", padding: 24 }}>No results published yet.</td></tr>}
                  {(me?.results || []).map(r => (
                    <tr key={r.courseCode}>
                      <td><div style={{ fontWeight: 700, fontSize: 12.5 }}>{r.courseName}</div><div style={{ fontSize: 10.5, color: "#A0AEC0", fontFamily: "monospace" }}>{r.courseCode}</div></td>
                      <td style={{ fontWeight: 700 }}>{r.internal}</td>
                      <td style={{ fontWeight: 700 }}>{r.external}</td>
                      <td style={{ fontWeight: 800 }}>{r.total}</td>
                      <td><span style={{ fontWeight: 800, color: GRADE_HEX[r.grade] || "#737373" }}>{r.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* My attendance */}
          <div className="card card-p">
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 14 }}>My Attendance by Course</div>
            {loading ? <Skeleton h={120} /> : (me?.attendance || []).length === 0 ? (
              <div style={{ color: "#A0AEC0", fontSize: 13 }}>No attendance recorded yet.</div>
            ) : (me?.attendance || []).map(a => (
              <div key={a.code} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0A1628" }}>{a.code} — {a.name}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: a.pct >= 85 ? "#0F9D58" : a.pct >= 75 ? "#F5A623" : "#C8102E" }}>{a.pct}%</span>
                </div>
                <div style={{ height: 7, background: "#F1F3F6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${a.pct}%`, background: a.pct >= 85 ? "#0F9D58" : a.pct >= 75 ? "#F5A623" : "#C8102E", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My timetable */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>My Weekly Timetable — {section}</div>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {byDay.map(({ day, slots }) => (
              <div key={day}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{day.slice(0, 3)}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {slots.length === 0 && <div style={{ fontSize: 11, color: "#C4C9D4" }}>—</div>}
                  {slots.map(c => (
                    <div key={c.id} style={{ padding: "8px 10px", borderRadius: 8, background: c.type === "lab" ? "rgba(245,166,35,0.1)" : "rgba(21,101,192,0.07)", borderLeft: `3px solid ${c.type === "lab" ? "#F5A623" : "#1565C0"}` }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#0A1628", lineHeight: 1.2 }}>{c.courseCode}</div>
                      <div style={{ fontSize: 9.5, color: "#737373", marginTop: 2 }}>{c.startTime} · {c.room}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
