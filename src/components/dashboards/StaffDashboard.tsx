"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { canAccess } from "@/lib/access";
import { BriefingCard } from "@/components/dashboards/BriefingCard";
import {
  DASHBOARD_STATS, AT_RISK_STUDENTS, EXAM_RESULTS_SUMMARY, HOSTEL_ROOMS,
  FEE_COLLECTION_MONTHLY, GRIEVANCES, FACULTY,
} from "@/lib/data";

// Role-scoped home for registrar/dean/finance/exam-officer/hostel-warden.
// Every panel is gated by the role's module access — nothing outside their remit is shown.
export function StaffDashboard() {
  const { user } = useApp();
  const role = user?.role;
  const can = (k: Parameters<typeof canAccess>[1]) => canAccess(role, k);

  // Client-only date — avoids SSR/client hydration mismatch on locale/time.
  const [today, setToday] = useState("");
  useEffect(() => { setToday(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })); }, []);

  const occCap = HOSTEL_ROOMS.reduce((s, r) => s + r.capacity, 0);
  const occUsed = HOSTEL_ROOMS.reduce((s, r) => s + r.occupied, 0);
  const feeMax = Math.max(...FEE_COLLECTION_MONTHLY.map(f => f.target));

  // KPI cards filtered by access
  const kpis = [
    can("students") && { label: "Students", value: DASHBOARD_STATS.totalStudents.toLocaleString("en-IN"), sub: `${DASHBOARD_STATS.activeStudents} active`, color: "#1565C0" },
    can("fees") && { label: "Fee Collected", value: DASHBOARD_STATS.feeCollected, sub: `${DASHBOARD_STATS.feePending} pending`, color: "#0F9D58" },
    (can("attendance") || can("mis")) && { label: "Attendance Today", value: DASHBOARD_STATS.attendanceToday, sub: "all programmes", color: "#F5A623" },
    can("hr") && { label: "Faculty", value: DASHBOARD_STATS.totalFaculty, sub: `${FACULTY.filter(f => f.status === "active").length} active`, color: "#9C27B0" },
    can("hostel") && { label: "Hostel Occupancy", value: `${Math.round((occUsed / occCap) * 100)}%`, sub: `${occCap - occUsed} beds free`, color: "#00838F" },
    can("grievance") && { label: "Open Grievances", value: GRIEVANCES.filter(g => g.status !== "resolved").length, sub: "needing action", color: "#C8102E" },
  ].filter(Boolean) as { label: string; value: string | number; sub: string; color: string }[];

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="page-hero">
        <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Welcome, {(user?.name || "").replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.) /, "").split(" ")[0]}</span></div>
        <div className="page-hero-sub fade-up fade-up-1">{role?.replace(/_/g, " ").toUpperCase()} · {user?.department || "KRMU"}{today ? ` · ${today}` : ""}</div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <BriefingCard />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(kpis.length, 5)}, 1fr)`, gap: 14, marginBottom: 22 }}>
          {kpis.map(k => (
            <div key={k.label} className="card card-p">
              <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: "-0.04em", margin: "6px 0 2px" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#737373" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {can("fees") && (
              <div className="card card-p">
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>Fee Collection vs Target</div>
                <div style={{ fontSize: 11.5, color: "#A0AEC0", marginBottom: 16 }}>₹ Lakhs · monthly</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 130 }}>
                  {FEE_COLLECTION_MONTHLY.map(f => (
                    <div key={f.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: "100%", width: "100%", justifyContent: "center" }}>
                        <div style={{ width: "32%", height: `${(f.target / feeMax) * 100}%`, background: "rgba(10,22,40,0.1)", borderRadius: "4px 4px 0 0" }} />
                        <div style={{ width: "32%", height: `${(f.collected / feeMax) * 100}%`, background: f.collected >= f.target ? "#0F9D58" : "#1565C0", borderRadius: "4px 4px 0 0" }} />
                      </div>
                      <span style={{ fontSize: 10.5, color: "#A0AEC0" }}>{f.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {can("examinations") && (
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Result Summary by Programme</div>
                <table className="tbl">
                  <thead><tr><th>Programme</th><th>Sem</th><th>Pass Rate</th><th>ATKT</th></tr></thead>
                  <tbody>
                    {EXAM_RESULTS_SUMMARY.map((r, i) => (
                      <tr key={i}><td style={{ fontWeight: 700, fontSize: 13 }}>{r.programme}</td><td>Sem {r.semester}</td>
                        <td style={{ fontWeight: 800, color: parseFloat(r.passRate) >= 93 ? "#0F9D58" : "#F5A623" }}>{r.passRate}</td>
                        <td style={{ color: "#F5A623", fontWeight: 700 }}>{r.atkt}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {can("hostel") && (
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Hostel Occupancy</div>
                <table className="tbl">
                  <thead><tr><th>Room</th><th>Block</th><th>Beds</th><th>Status</th></tr></thead>
                  <tbody>
                    {HOSTEL_ROOMS.slice(0, 6).map(r => (
                      <tr key={r.id}><td style={{ fontWeight: 700 }}>{r.roomNo}</td><td style={{ fontSize: 12.5 }}>{r.block}</td>
                        <td>{r.occupied}/{r.capacity}</td>
                        <td><span className={`chip ${r.status === "available" ? "chip-green" : r.status === "occupied" ? "chip-blue" : "chip-amber"}`}>{r.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {can("students") && (
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>At-Risk Students</div>
                <div style={{ padding: 12 }}>
                  {AT_RISK_STUDENTS.slice(0, 6).map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderBottom: "1px solid rgba(10,22,40,0.04)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628" }}>{s.name}</div>
                        <div style={{ fontSize: 10.5, color: "#A0AEC0" }}>{s.programme} · Sem {s.semester}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.attendance < 75 ? "#C8102E" : "#F5A623" }}>{s.attendance}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions by access */}
            <div className="card card-p">
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0A1628", marginBottom: 12 }}>Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {can("approvals") && <Link href="/dashboard/approvals" className="btn btn-ghost cursor-hover" style={{ justifyContent: "flex-start", textDecoration: "none" }}>Review AI approvals →</Link>}
                {can("workflows") && <Link href="/dashboard/workflows" className="btn btn-ghost cursor-hover" style={{ justifyContent: "flex-start", textDecoration: "none" }}>Run an AI workflow →</Link>}
                {can("registration") && <Link href="/dashboard/registration" className="btn btn-ghost cursor-hover" style={{ justifyContent: "flex-start", textDecoration: "none" }}>Registration queue →</Link>}
                {can("predictions") && <Link href="/dashboard/predictions" className="btn btn-ghost cursor-hover" style={{ justifyContent: "flex-start", textDecoration: "none" }}>View predictions →</Link>}
                {can("grievance") && <Link href="/dashboard/grievance" className="btn btn-ghost cursor-hover" style={{ justifyContent: "flex-start", textDecoration: "none" }}>Open grievances →</Link>}
                {can("certificates") && <Link href="/dashboard/certificates" className="btn btn-ghost cursor-hover" style={{ justifyContent: "flex-start", textDecoration: "none" }}>Certificate requests →</Link>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
