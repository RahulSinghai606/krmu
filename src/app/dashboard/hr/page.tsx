"use client";
import { useState } from "react";
import { FACULTY } from "@/lib/data";
import { formatDate, getInitials, formatCurrency } from "@/lib/utils";

export default function HRPage() {
  const [tab, setTab] = useState<"directory"|"leave"|"payroll">("directory");
  const [selected, setSelected] = useState<string | null>(null);

  const active = FACULTY.find(f => f.id === selected);
  const totalPayroll = FACULTY.reduce((s, f) => s + f.salary, 0);

  const LEAVE = [
    { name: "Dr. Swati Bansal", type: "Sabbatical Leave", from: "2025-01-01", to: "2025-06-30", status: "approved", days: 181 },
    { name: "Dr. Pankaj Mishra", type: "Casual Leave", from: "2025-02-03", to: "2025-02-04", status: "pending", days: 2 },
    { name: "Dr. Kavitha Reddy", type: "Conference Leave", from: "2025-02-18", to: "2025-02-20", status: "approved", days: 3 },
    { name: "Dr. Rohit Bhatnagar", type: "Medical Leave", from: "2025-01-28", to: "2025-01-30", status: "pending", days: 3 },
  ];

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">HR & Faculty</span></div>
            <div className="page-hero-sub fade-up fade-up-1">186 faculty · 94 non-teaching staff · 8 schools</div>
          </div>
          <button className="btn btn-gold btn-sm cursor-hover">+ Add Faculty</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Active Faculty", value: FACULTY.filter(f => f.status === "active").length + " / 8", color: "white" },
            { label: "On Leave", value: FACULTY.filter(f => f.status === "on-leave").length, color: "#F5A623" },
            { label: "Avg Experience", value: Math.round(FACULTY.reduce((s, f) => s + f.experience, 0) / FACULTY.length) + " yrs", color: "#1565C0" },
            { label: "Monthly Payroll", value: `₹${(totalPayroll / 100000).toFixed(1)} L`, color: "#0F9D58" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderBottom: "1px solid rgba(10,22,40,0.07)", padding: "0 24px", display: "flex", gap: 28, flexShrink: 0 }}>
        {([["directory","Faculty Directory"],["leave","Leave Management"],["payroll","Payroll"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className="cursor-hover"
            style={{ padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none",
              color: tab === t ? "#0A1628" : "#737373", borderBottom: tab === t ? "2px solid #0A1628" : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {tab === "directory" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {FACULTY.map(f => (
                <button key={f.id} onClick={() => setSelected(f.id)} className="card cursor-hover"
                  style={{ padding: "16px 18px", textAlign: "left", border: selected === f.id ? "1.5px solid #0A1628" : "1px solid rgba(10,22,40,0.07)", cursor: "none" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg, #1f6fd6, #1250a6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>{getInitials(f.name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{f.name}</div>
                      <div style={{ fontSize: 11.5, color: "#737373", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.designation}</div>
                    </div>
                    <span className={`chip ${f.status === "active" ? "chip-green" : "chip-amber"}`} style={{ marginLeft: "auto", fontSize: 9.5 }}>{f.status}</span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11.5, color: "#525252", lineHeight: 1.5 }}>
                    <div>{f.department} · {f.school}</div>
                    <div style={{ color: "#A0AEC0", marginTop: 2 }}>{f.specialization}</div>
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(10,22,40,0.05)" }}>
                    <div><span style={{ fontSize: 15, fontWeight: 800, color: "#0A1628" }}>{f.experience}</span><span style={{ fontSize: 10.5, color: "#A0AEC0" }}> yrs exp</span></div>
                    <div style={{ fontSize: 11, color: "#737373", alignSelf: "flex-end" }}>{f.qualification}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === "leave" && (
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="tbl">
                <thead><tr><th>Faculty</th><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {LEAVE.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, fontSize: 13 }}>{l.name}</td>
                      <td style={{ fontSize: 12.5 }}>{l.type}</td>
                      <td style={{ fontSize: 12.5 }}>{formatDate(l.from)}</td>
                      <td style={{ fontSize: 12.5 }}>{formatDate(l.to)}</td>
                      <td style={{ fontWeight: 700 }}>{l.days}</td>
                      <td><span className={`chip ${l.status === "approved" ? "chip-green" : "chip-amber"}`}>{l.status}</span></td>
                      <td>{l.status === "pending" ? <div style={{ display: "flex", gap: 5 }}><button className="btn btn-sm btn-blue cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Approve</button><button className="btn btn-sm btn-ghost cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Reject</button></div> : <span style={{ fontSize: 11, color: "#A0AEC0" }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "payroll" && (
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="tbl">
                <thead><tr><th>Employee ID</th><th>Faculty</th><th>Designation</th><th>Basic</th><th>HRA (40%)</th><th>Gross</th><th>Status</th></tr></thead>
                <tbody>
                  {FACULTY.map(f => {
                    const hra = Math.round(f.salary * 0.4);
                    return (
                      <tr key={f.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{f.employeeId}</td>
                        <td style={{ fontWeight: 700, fontSize: 13 }}>{f.name}</td>
                        <td style={{ fontSize: 12 }}>{f.designation}</td>
                        <td>{formatCurrency(f.salary)}</td>
                        <td>{formatCurrency(hra)}</td>
                        <td style={{ fontWeight: 800 }}>{formatCurrency(f.salary + hra)}</td>
                        <td><span className="chip chip-green">processed</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {tab === "directory" && active && (
          <div style={{ width: 360, borderLeft: "1px solid rgba(10,22,40,0.07)", background: "white", overflowY: "auto" }}>
            <div style={{ background: "#1565C0", padding: "24px 22px", color: "white" }}>
              <button onClick={() => setSelected(null)} className="cursor-hover" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "none", float: "right" }}>×</button>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, #1565C0, #F5A623)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>{getInitials(active.name)}</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{active.name}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{active.designation}</div>
            </div>
            <div style={{ padding: "20px 22px" }}>
              {[
                ["Employee ID", active.employeeId],
                ["Department", active.department],
                ["School", active.school],
                ["Qualification", active.qualification],
                ["Specialization", active.specialization],
                ["Experience", `${active.experience} years`],
                ["Joined", formatDate(active.joiningDate)],
                ["Email", active.email],
                ["Phone", active.phone],
              ].map(([l, v]) => (
                <div key={l} style={{ padding: "10px 0", borderBottom: "1px solid rgba(10,22,40,0.05)" }}>
                  <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0A1628", marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
