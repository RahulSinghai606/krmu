"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { TIMETABLE, STUDENTS } from "@/lib/data";
import { Skeleton } from "@/components/ui/Skeleton";
import { BriefingCard } from "@/components/dashboards/BriefingCard";

interface MeData {
  kind: string;
  faculty?: { id: string; name: string; designation: string; department: string; school: string };
  courses?: { code: string; name: string; semester: number; programme: string; credits: number }[];
  resultCount?: number;
  draftResults?: number;
}

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TODAY = "Monday"; // demo "today"

export function FacultyDashboard() {
  const { user } = useApp();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/me?email=${encodeURIComponent(user.email)}`).then(r => r.json()).then(setMe).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const fac = me?.faculty;
  const myClasses = fac ? TIMETABLE.filter(t => t.facultyName === fac.name) : [];
  const todayClasses = myClasses.filter(c => c.day === TODAY);
  const atRisk = STUDENTS.filter(s => s.programme === "B.Tech CSE" && s.attendance < 75);

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="page-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Welcome, {(user?.name || "Faculty").replace("Dr. ", "").replace("Prof. ", "").split(" ")[0]}</span></div>
          <div className="page-hero-sub fade-up fade-up-1">{fac ? `${fac.designation} · ${fac.department} · ${fac.school}` : "Your teaching dashboard"}</div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <BriefingCard />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 22 }}>
          {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card card-p"><Skeleton h={60} /></div>) : [
            { label: "Courses I Teach", value: me?.courses?.length ?? 0, sub: "This semester", color: "#1565C0" },
            { label: "Classes Today", value: todayClasses.length, sub: TODAY, color: "#0F9D58" },
            { label: "Marks Pending", value: me?.draftResults ?? 0, sub: "Draft / unpublished", color: (me?.draftResults ?? 0) > 0 ? "#F5A623" : "#0F9D58" },
            { label: "Students at Risk", value: atRisk.length, sub: "Below 75% attendance", color: atRisk.length ? "#C8102E" : "#0F9D58" },
          ].map(c => (
            <div key={c.label} className="card card-p">
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 11.5, color: "#737373", marginTop: 6 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 18 }}>
          {/* Today's classes */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Today&apos;s Classes — {TODAY}</span>
              <Link href="/dashboard/attendance" className="btn btn-primary btn-sm cursor-hover" style={{ textDecoration: "none" }}>Mark Attendance →</Link>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {todayClasses.length === 0 && <div style={{ color: "#A0AEC0", fontSize: 13, padding: 12 }}>No classes scheduled today.</div>}
              {todayClasses.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10, background: "#F7F7F5", borderLeft: `3px solid ${c.type === "lab" ? "#F5A623" : "#1565C0"}` }}>
                  <div style={{ textAlign: "center", minWidth: 52 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0A1628" }}>{c.startTime}</div>
                    <div style={{ fontSize: 10, color: "#A0AEC0" }}>{c.endTime}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0A1628" }}>{c.courseName}</div>
                    <div style={{ fontSize: 11.5, color: "#737373" }}>{c.courseCode} · {c.section} · {c.room}</div>
                  </div>
                  <span className={`chip ${c.type === "lab" ? "chip-amber" : "chip-blue"}`}>{c.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* My courses */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>My Courses</span>
              <Link href="/dashboard/examinations" className="btn btn-ghost btn-sm cursor-hover" style={{ textDecoration: "none" }}>Marks Entry</Link>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? <Skeleton h={100} /> : (me?.courses || []).length === 0 ? <div style={{ color: "#A0AEC0", fontSize: 13 }}>No courses assigned.</div> : (me?.courses || []).map(c => (
                <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(10,22,40,0.06)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#A0AEC0", fontFamily: "monospace" }}>{c.code} · Sem {c.semester} · {c.programme}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#1565C0" }}>{c.credits} cr</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* At-risk students */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Students Needing Attention</div>
          <table className="tbl">
            <thead><tr><th>Student</th><th>Programme</th><th>Attendance</th><th>CGPA</th><th>Flag</th></tr></thead>
            <tbody>
              {atRisk.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#A0AEC0", padding: 24 }}>No students below threshold.</td></tr>}
              {atRisk.map(s => (
                <tr key={s.id}>
                  <td><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: "#A0AEC0" }}>{s.enrollmentNo}</div></td>
                  <td style={{ fontSize: 12.5 }}>{s.programme} · Sem {s.semester}</td>
                  <td style={{ fontWeight: 800, color: "#C8102E" }}>{s.attendance}%</td>
                  <td style={{ fontWeight: 700, color: s.cgpa >= 8 ? "#0F9D58" : s.cgpa >= 6 ? "#F5A623" : "#C8102E" }}>{s.cgpa}</td>
                  <td><span className="chip chip-red">Attendance shortage</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
