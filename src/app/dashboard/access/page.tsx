"use client";
import { useState, useEffect } from "react";

const ROLES = [
  { role: "Admin", users: 4, color: "#C8102E", desc: "Full system control, configuration, audit" },
  { role: "Registrar", users: 6, color: "#0A1628", desc: "Academic records, registration, certificates" },
  { role: "Dean", users: 8, color: "#1565C0", desc: "School-level oversight, approvals, analytics" },
  { role: "HOD", users: 34, color: "#9C27B0", desc: "Department faculty, courses, attendance" },
  { role: "Faculty", users: 186, color: "#0F9D58", desc: "Marks entry, attendance, course content" },
  { role: "Finance Officer", users: 9, color: "#F5A623", desc: "Fee collection, payroll, financial reports" },
  { role: "Exam Officer", users: 7, color: "#00838F", desc: "Exam scheduling, results, transcripts" },
  { role: "Student", users: 3842, color: "#607D8B", desc: "Self-service portal, registration, results" },
];

const MODULES = ["Students", "Curriculum", "Registration", "Attendance", "Examinations", "Fees", "HR", "Hostel", "Grievance", "Certificates", "Accreditation", "MIS", "Notifications"];

const MATRIX: Record<string, Record<string, "full"|"read"|"none">> = {
  Admin: Object.fromEntries(MODULES.map(m => [m, "full"])),
  Registrar: { Students: "full", Curriculum: "full", Registration: "full", Attendance: "read", Examinations: "read", Fees: "read", HR: "none", Hostel: "read", Grievance: "full", Certificates: "full", Accreditation: "full", MIS: "read", Notifications: "full" },
  Dean: { Students: "read", Curriculum: "full", Registration: "read", Attendance: "read", Examinations: "read", Fees: "read", HR: "read", Hostel: "none", Grievance: "read", Certificates: "none", Accreditation: "read", MIS: "full", Notifications: "full" },
  Faculty: { Students: "read", Curriculum: "read", Registration: "none", Attendance: "full", Examinations: "full", Fees: "none", HR: "none", Hostel: "none", Grievance: "read", Certificates: "none", Accreditation: "none", MIS: "none", Notifications: "read" },
  "Finance Officer": { Students: "read", Curriculum: "none", Registration: "read", Attendance: "none", Examinations: "none", Fees: "full", HR: "full", Hostel: "read", Grievance: "read", Certificates: "none", Accreditation: "read", MIS: "read", Notifications: "full" },
};

const CELL: Record<string, { bg: string; text: string; label: string }> = {
  full: { bg: "rgba(15,157,88,0.12)", text: "#0F7B45", label: "Full" },
  read: { bg: "rgba(21,101,192,0.1)", text: "#1565C0", label: "Read" },
  none: { bg: "#F1F3F6", text: "#C4C9D4", label: "—" },
};

export default function AccessPage() {
  const [role, setRole] = useState("Registrar");
  const matrix = MATRIX[role] || MATRIX.Faculty;

  const [logs, setLogs] = useState<{ id: string; actor: string; role: string; action: string; module: string; detail: string; at: string }[]>([]);
  useEffect(() => {
    fetch("/api/audit").then(r => r.json()).then(d => setLogs(d.logs || [])).catch(() => {});
  }, []);
  const ago = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} d ago`;
  };

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Identity & Access Control</span></div>
            <div className="page-hero-sub fade-up fade-up-1">RBAC · SSO-ready · {ROLES.reduce((s, r) => s + r.users, 0).toLocaleString("en-IN")} identities · Audit-logged</div>
          </div>
          <button className="btn btn-gold btn-sm cursor-hover">+ Define Role</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 26 }}>
          {ROLES.map(r => (
            <button key={r.role} onClick={() => setRole(r.role)} className="card cursor-hover"
              style={{ padding: "16px 18px", textAlign: "left", cursor: "none", border: role === r.role ? `1.5px solid ${r.color}` : "1px solid rgba(10,22,40,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color }} />
                <span style={{ fontSize: 18, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.03em" }}>{r.users.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginTop: 10 }}>{r.role}</div>
              <div style={{ fontSize: 11, color: "#737373", marginTop: 4, lineHeight: 1.45 }}>{r.desc}</div>
            </button>
          ))}
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(10,22,40,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Permission Matrix — <span style={{ color: "#1565C0" }}>{role}</span></div>
            <div style={{ display: "flex", gap: 12 }}>
              {Object.entries(CELL).map(([k, v]) => (
                <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#737373" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: v.bg }} /> {v.label === "—" ? "No access" : v.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {MODULES.map(m => {
              const perm = matrix[m] || "none";
              const c = CELL[perm];
              return (
                <div key={m} style={{ padding: "12px 14px", borderRadius: 10, background: c.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0A1628" }}>{m}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: c.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-p" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0A1628" }}>Live Audit Log</div>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0F9D58" }} />
            <span style={{ fontSize: 11, color: "#A0AEC0" }}>{logs.length} recent events</span>
          </div>
          {logs.length === 0 && <div style={{ fontSize: 12.5, color: "#A0AEC0", padding: "8px 0" }}>No audit events yet — actions across the ERP will appear here.</div>}
          {logs.map((l, i) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < logs.length - 1 ? "1px solid rgba(10,22,40,0.05)" : "none" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0F9D58", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#0A1628", fontWeight: 600, fontFamily: "monospace" }}>{l.actor}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#1565C0", background: "rgba(21,101,192,0.08)", padding: "1px 6px", borderRadius: 4 }}>{l.module}</span>
              <span style={{ fontSize: 12.5, color: "#525252" }}>{l.action} — {l.detail}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#A0AEC0", width: 70, textAlign: "right" }}>{ago(l.at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
