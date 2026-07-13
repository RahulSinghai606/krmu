"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { FacultyDashboard } from "@/components/dashboards/FacultyDashboard";
import { StaffDashboard } from "@/components/dashboards/StaffDashboard";
import {
  DASHBOARD_STATS, SCHOOL_DISTRIBUTION, FEE_COLLECTION_MONTHLY,
  ATTENDANCE_WEEKLY, AT_RISK_STUDENTS, UPCOMING_EXAMS,
  ENROLMENT_TREND, AI_INSIGHTS, STUDENTS, NOTIFICATIONS
} from "@/lib/data";
import { getStatusColor } from "@/lib/utils";

/* ── Tiny inline SVG bar chart ── */
function MiniBar({ data, color = "#1565C0" }: { data: { v: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
      {data.map((d, i) => (
        <div key={i} style={{
          flex: 1, background: color,
          height: `${(d.v / max) * 100}%`,
          borderRadius: "3px 3px 0 0",
          opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.4,
          transition: "height 0.6s cubic-bezier(0.16,1,0.3,1)",
        }} />
      ))}
    </div>
  );
}

/* ── Donut chart for school distribution ── */
function DonutChart() {
  const total = SCHOOL_DISTRIBUTION.reduce((s, d) => s + d.students, 0);
  let cumulative = 0;
  const segments = SCHOOL_DISTRIBUTION.map(d => {
    const pct = d.students / total;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });

  const r = 60, cx = 70, cy = 70, stroke = 22;
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
      <svg width={140} height={140} style={{ flexShrink: 0 }}>
        {segments.map((s, i) => {
          const dash = s.pct * circumference;
          const gap = circumference - dash;
          const offset = circumference - s.start * circumference;
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 18, fontWeight: 800, fill: "#0A1628", letterSpacing: "-0.04em" }}>{total.toLocaleString("en-IN")}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 9, fill: "#A0AEC0", fontWeight: 600, letterSpacing: "0.06em" }}>STUDENTS</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        {SCHOOL_DISTRIBUTION.slice(0, 5).map(d => (
          <div key={d.school} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11.5, color: "#525252", letterSpacing: "-0.01em" }}>{d.school}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0A1628" }}>{d.students.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mini line chart for attendance ── */
function AttendanceLine() {
  const W = 240, H = 56;
  const max = 100, min = 60;
  const pts = ATTENDANCE_WEEKLY.map((d, i) => ({
    x: 20 + (i / (ATTENDANCE_WEEKLY.length - 1)) * (W - 40),
    y: H - 8 - ((d.percentage - min) / (max - min)) * (H - 16),
    pct: d.percentage,
    day: d.day,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1565C0" stopOpacity={0.2}/>
          <stop offset="100%" stopColor="#1565C0" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#attGrad)"/>
      <path d={pathD} fill="none" stroke="#1565C0" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="white" stroke="#1565C0" strokeWidth={2}/>
          <text x={p.x} y={H + 2} textAnchor="middle" style={{ fontSize: 9, fill: "#A0AEC0", fontWeight: 500 }}>{p.day.slice(0,2)}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Fee collection bar ── */
function FeeBar() {
  const max = Math.max(...FEE_COLLECTION_MONTHLY.map(d => d.target));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {FEE_COLLECTION_MONTHLY.map(d => (
        <div key={d.month}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#737373", fontWeight: 600, letterSpacing: "0.01em" }}>{d.month}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0A1628" }}>₹{d.collected}L <span style={{ color: "#A0AEC0", fontWeight: 400 }}>/ ₹{d.target}L</span></span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(d.collected / max) * 100}%`, background: d.collected >= d.target ? "#0F9D58" : d.collected / d.target > 0.8 ? "#F5A623" : "#C8102E" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stats marquee ── */
const MARQUEE_ITEMS = [
  { label: "Total Students", value: "3,842", color: "#1565C0" },
  { label: "Faculty Members", value: "186", color: "#0F9D58" },
  { label: "Active Programmes", value: "34", color: "#9C27B0" },
  { label: "Today's Attendance", value: "78.4%", color: "#F5A623" },
  { label: "Fee Collected", value: "₹18.6 Cr", color: "#0F9D58" },
  { label: "Pending Dues", value: "₹2.14 Cr", color: "#C8102E" },
  { label: "Open Grievances", value: "12", color: "#F59E0B" },
  { label: "Hostel Occupancy", value: "87%", color: "#1565C0" },
  { label: "Exams Pending", value: "3", color: "#C8102E" },
  { label: "At-Risk Students", value: "34", color: "#F5A623" },
  { label: "NAAC Grade", value: "A", color: "#0F9D58" },
  { label: "Reg. Complete", value: "94%", color: "#0F9D58" },
];

export default function DashboardPage() {
  const { user } = useApp();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [activeInsight, setActiveInsight] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const runInsight = async (action: string) => {
    if (action === "View defaulters") { router.push("/dashboard/fees"); return; }
    if (action === "Review schedule") { router.push("/dashboard/examinations"); return; }
    if (action === "Send reminders") {
      const ok = await confirm({ title: "Send fee reminders?", message: "Notify all students with outstanding dues via SMS + WhatsApp.", confirmLabel: "Send" });
      if (!ok) return;
      await fireAction("fee_reminders");
      return;
    }
    if (action === "Draft notices") {
      const ok = await confirm({ title: "Draft shortage notices?", message: "Generate attendance-shortage notices for students below 75% and queue to mentors.", confirmLabel: "Draft" });
      if (!ok) return;
      await fireAction("attendance_notices");
      return;
    }
  };

  const fireAction = async (type: string) => {
    setBusyAction(true);
    try {
      const res = await fetch("/api/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, _actor: user?.email, _role: user?.role }) });
      const data = await res.json();
      if (res.ok) toast.success("Done", data.message); else toast.error("Failed", data.error);
    } catch { toast.error("Failed", "Network error"); }
    finally { setBusyAction(false); }
  };

  // Role-specific home — personalized/scoped, never the generic admin view for everyone.
  if (user?.role === "student") return <StudentDashboard />;
  if (user?.role === "faculty") return <FacultyDashboard />;
  if (user && user.role !== "admin") return <StaffDashboard />;

  const insightColors = { info: "#1565C0", warning: "#F5A623", success: "#0F9D58", danger: "#C8102E" } as const;
  const insightBg = { info: "#EBF2FD", warning: "#FEF9EC", success: "#E8F5EE", danger: "#FCEAED" } as const;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── PAGE HERO ── */}
      <div className="page-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(245,166,35,0.8)", background: "rgba(245,166,35,0.08)",
              padding: "3px 10px", borderRadius: 12, border: "1px solid rgba(245,166,35,0.15)",
            }}>
              January 25, 2025 · Even Semester 2024–25
            </span>
          </div>
          <div className="reveal-wrap" style={{ marginTop: 10 }}>
            <span className="reveal-inner" style={{
              display: "block",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 800, letterSpacing: "-0.04em",
              color: "white", lineHeight: 1,
            }}>
              Good morning, {user?.name.split(" ")[0]} 👋
            </span>
          </div>
          <div className="fade-up fade-up-1" style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 8 }}>
            Here's what's happening across K.R. Mangalam University today.
          </div>
        </div>
      </div>

      {/* ── MARQUEE STATS ── */}
      <div style={{ background: "#1565C0", borderBottom: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }} className="marquee-container">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="marquee-track-inner" style={{ display: "contents" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 24px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)",
                whiteSpace: "nowrap",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          .marquee-track {
            display: flex;
            animation: marqueeScroll 40s linear infinite;
            width: max-content;
          }
          .marquee-container:hover .marquee-track {
            animation-play-state: paused;
          }
          @keyframes marqueeScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* ── AI INSIGHTS ── */}
      <div style={{ padding: "24px 28px 0" }}>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
          {AI_INSIGHTS.map((insight, i) => {
            const typeKey = insight.type as keyof typeof insightColors;
            return (
              <div
                key={i}
                onClick={() => setActiveInsight(activeInsight === i ? null : i)}
                className="cursor-hover"
                style={{
                  flexShrink: 0, width: 280, padding: "14px 16px",
                  borderRadius: 14, cursor: "none",
                  background: activeInsight === i ? insightBg[typeKey] : "white",
                  border: `1.5px solid ${activeInsight === i ? insightColors[typeKey] : "rgba(10,22,40,0.08)"}`,
                  transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: insightBg[typeKey],
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={insightColors[typeKey]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {insight.type === "warning" && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                      {insight.type === "info" && <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}
                      {insight.type === "success" && <><polyline points="20 6 9 17 4 12"/></>}
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{insight.title}</div>
                    <div style={{ fontSize: 11.5, color: "#737373", marginTop: 4, lineHeight: 1.5 }}>{insight.message}</div>
                    <button
                      onClick={e => { e.stopPropagation(); runInsight(insight.action); }}
                      disabled={busyAction}
                      className="cursor-hover"
                      style={{
                        marginTop: 8, fontSize: 11, fontWeight: 700,
                        color: insightColors[typeKey], background: "none", border: "none", padding: 0,
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      {insight.action}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        {[
          { label: "Total Students", value: "3,842", sub: "+241 vs last year", color: "#1565C0", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7 a4 4 0 1 0 8 0 a4 4 0 1 0-8 0 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
          { label: "Faculty Strength", value: "186", sub: "12 on leave", color: "#0F9D58", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3 a4 4 0 1 0 8 0 a4 4 0 1 0-8 0" },
          { label: "Today Attendance", value: "78.4%", sub: "Below 75%: 34 students", color: "#F5A623", icon: "M9 11 l3 3 10-10 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
          { label: "Fee Collected", value: "₹18.6 Cr", sub: "₹2.14 Cr pending", color: "#C8102E", icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
        ].map(s => (
          <div key={s.label} className="card card-p cursor-hover" style={{ transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {s.icon.split(" M").map((d, i) => <path key={i} d={(i === 0 ? "" : "M") + d} />)}
                </svg>
              </div>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0F9D58" }} />
            </div>
            <div className="stat-number">{s.value}</div>
            <div style={{ fontSize: 12, color: "#737373", marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ padding: "0 28px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {/* School distribution */}
        <div className="card card-p">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 4 }}>Enrolment by School</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A1628" }}>8 Schools · 34 Programmes</div>
          </div>
          <DonutChart />
        </div>

        {/* Attendance weekly */}
        <div className="card card-p">
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 4 }}>Weekly Attendance</div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A1628" }}>This Week</div>
            </div>
            <span style={{ fontSize: 11, background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>↑ 2.1%</span>
          </div>
          <AttendanceLine />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(10,22,40,0.06)" }}>
            {ATTENDANCE_WEEKLY.map(d => (
              <div key={d.day} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: d.percentage < 75 ? "#C8102E" : "#0A1628" }}>{d.percentage}%</div>
                <div style={{ fontSize: 9.5, color: "#A0AEC0", fontWeight: 600, marginTop: 2 }}>{d.day.slice(0,3)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fee collection */}
        <div className="card card-p">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 4 }}>Fee Collection 2024–25</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A1628" }}>Target vs Collected (₹ Lakhs)</div>
          </div>
          <FeeBar />
        </div>
      </div>

      {/* ── BOTTOM SECTION ── */}
      <div style={{ padding: "0 28px 28px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        {/* At-risk students */}
        <div className="card">
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(10,22,40,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 2 }}>Needs Attention</div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A1628" }}>At-Risk Students</div>
            </div>
            <span style={{ padding: "4px 10px", borderRadius: 8, background: "#FCEAED", color: "#C8102E", fontSize: 12, fontWeight: 700 }}>
              {AT_RISK_STUDENTS.length} flagged
            </span>
          </div>
          <div>
            {AT_RISK_STUDENTS.slice(0, 5).map((s, i) => {
              const risks = [];
              if (s.attendance < 75) risks.push({ label: `${s.attendance}% att.`, color: "#C8102E" });
              if (s.feeDue > 0) risks.push({ label: `₹${(s.feeDue/1000).toFixed(0)}K due`, color: "#F5A623" });
              if (s.cgpa < 6.5) risks.push({ label: `CGPA ${s.cgpa}`, color: "#C8102E" });
              return (
                <div key={s.id} style={{
                  padding: "12px 20px",
                  borderBottom: i < AT_RISK_STUDENTS.length - 1 && i < 4 ? "1px solid rgba(10,22,40,0.05)" : "none",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(10,22,40,0.08), rgba(10,22,40,0.04))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#0A1628",
                  }}>
                    {s.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#737373" }}>{s.programme} · Sem {s.semester}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {risks.map(r => (
                      <span key={r.label} style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: `${r.color}14`, color: r.color }}>
                        {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(10,22,40,0.05)" }}>
            <button className="btn btn-ghost btn-sm cursor-hover" style={{ fontSize: 12, gap: 5 }}>
              View all {AT_RISK_STUDENTS.length} at-risk students
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Upcoming exams + Recent notifications */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Upcoming exams */}
          <div className="card card-p" style={{ flex: 1 }}>
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 2 }}>Upcoming</div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A1628" }}>Examinations</div>
              </div>
              <span style={{ fontSize: 10.5, background: "#EBF2FD", color: "#1565C0", padding: "3px 9px", borderRadius: 6, fontWeight: 700 }}>Feb 2025</span>
            </div>
            {UPCOMING_EXAMS.slice(0, 4).map((ex, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, paddingBottom: 10, marginBottom: 10,
                borderBottom: i < 3 ? "1px solid rgba(10,22,40,0.05)" : "none",
              }}>
                <div style={{
                  width: 38, flexShrink: 0, borderRadius: 8,
                  background: "linear-gradient(135deg, #1f6fd6, #1250a6)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "6px 4px",
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1 }}>{ex.date.split("-")[2]}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
                    {new Date(ex.date).toLocaleDateString("en", {month:"short"})}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.subject}</div>
                  <div style={{ fontSize: 11, color: "#737373" }}>{ex.code} · {ex.time}</div>
                  <div style={{ fontSize: 10.5, color: "#A0AEC0", marginTop: 1 }}>{ex.room}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Enrolment trend mini */}
          <div className="card card-p">
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 2 }}>5-Year Trend</div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A1628" }}>Enrolment Growth</div>
            </div>
            <MiniBar data={ENROLMENT_TREND.map(d => ({ v: d.students }))} color="#1565C0" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {ENROLMENT_TREND.map(d => (
                <div key={d.year} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9.5, color: "#A0AEC0", fontWeight: 500 }}>{d.year.slice(2)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(10,22,40,0.05)", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9.5, color: "#A0AEC0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>5yr growth</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F9D58", letterSpacing: "-0.03em" }}>+32.9%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9.5, color: "#A0AEC0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>YoY 24–25</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1565C0", letterSpacing: "-0.03em" }}>+6.4%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT NOTIFICATIONS STRIP ── */}
      <div style={{ margin: "0 28px 28px", borderRadius: 16, background: "#1565C0", padding: "20px 24px", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, position: "relative" }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>System</div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: "white" }}>Recent Broadcasts</div>
          </div>
          <button className="btn cursor-hover" style={{ background: "rgba(255,255,255,0.08)", color: "white", fontSize: 11.5, padding: "6px 14px", borderRadius: 8 }}>
            View All
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, position: "relative" }}>
          {NOTIFICATIONS.slice(0, 3).map(n => {
            const typeColor = { info: "#1565C0", warning: "#F5A623", success: "#0F9D58", urgent: "#C8102E" }[n.type];
            return (
              <div key={n.id} style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12, padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: `${typeColor}22`, color: typeColor, padding: "2px 8px", borderRadius: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {n.type}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{new Date(n.sentAt).toLocaleDateString("en-IN", { month: "short", day: "2-digit" })}</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "white", letterSpacing: "-0.01em", lineHeight: 1.35, marginBottom: 5 }}>{n.title}</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.message}</div>
                <div style={{ marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.25)" }}>
                  {n.readCount.toLocaleString("en-IN")} of {n.totalRecipients.toLocaleString("en-IN")} read · {n.channels.join(", ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
