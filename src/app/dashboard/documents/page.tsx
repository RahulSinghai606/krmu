"use client";
import { useState } from "react";
import { formatDate } from "@/lib/utils";

const FOLDERS = [
  { name: "Academic Records", count: 1284, color: "#1565C0", icon: "M" },
  { name: "Statutory & Compliance", count: 312, color: "#C8102E", icon: "S" },
  { name: "Student Files", count: 3842, color: "#0F9D58", icon: "P" },
  { name: "HR & Payroll", count: 580, color: "#F5A623", icon: "H" },
  { name: "Financial Records", count: 942, color: "#9C27B0", icon: "F" },
  { name: "Circulars & Policies", count: 168, color: "#00838F", icon: "C" },
];

const FILES = [
  { name: "Academic Calendar 2024-25.pdf", folder: "Circulars & Policies", size: "2.4 MB", date: "2025-01-02", by: "Registrar Office", type: "pdf" },
  { name: "NAAC SSR Final Submission.pdf", folder: "Statutory & Compliance", size: "18.6 MB", date: "2023-11-20", by: "IQAC", type: "pdf" },
  { name: "Faculty Recruitment Policy v3.docx", folder: "HR & Payroll", size: "640 KB", date: "2024-12-15", by: "HR Department", type: "doc" },
  { name: "Examination Ordinance 2024.pdf", folder: "Academic Records", size: "3.1 MB", date: "2024-08-10", by: "Examination Cell", type: "pdf" },
  { name: "Fee Structure 2024-25 (All Programmes).xlsx", folder: "Financial Records", size: "1.2 MB", date: "2024-07-01", by: "Finance Department", type: "xls" },
  { name: "Anti-Ragging Affidavit Format.pdf", folder: "Circulars & Policies", size: "180 KB", date: "2024-08-01", by: "Dean Student Welfare", type: "pdf" },
  { name: "AISHE Data 2023-24.xlsx", folder: "Statutory & Compliance", size: "4.8 MB", date: "2024-03-30", by: "MIS Cell", type: "xls" },
];

const TYPE_COLOR: Record<string, string> = { pdf: "#C8102E", doc: "#1565C0", xls: "#0F9D58" };

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const files = FILES.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Document Management</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Centralized repository · Version-controlled · Role-scoped access</div>
          </div>
          <button className="btn btn-gold btn-sm cursor-hover">⬆ Upload</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 26 }}>
          {FOLDERS.map(f => (
            <div key={f.name} className="card cursor-hover" style={{ padding: "16px 18px" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}15`, color: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em", lineHeight: 1.25 }}>{f.name}</div>
              <div style={{ fontSize: 11.5, color: "#A0AEC0", marginTop: 4 }}>{f.count.toLocaleString("en-IN")} documents</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0A1628" }}>Recent Documents</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" className="field-input cursor-hover" style={{ width: 240, height: 34, fontSize: 12.5 }} />
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead><tr><th>Document</th><th>Folder</th><th>Size</th><th>Modified</th><th>Owner</th><th></th></tr></thead>
            <tbody>
              {files.map(f => (
                <tr key={f.name}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 7, background: `${TYPE_COLOR[f.type]}12`, color: TYPE_COLOR[f.type], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, textTransform: "uppercase", flexShrink: 0 }}>{f.type}</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{f.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "#737373" }}>{f.folder}</td>
                  <td style={{ fontSize: 12 }}>{f.size}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(f.date)}</td>
                  <td style={{ fontSize: 12, color: "#737373" }}>{f.by}</td>
                  <td><button className="btn btn-sm btn-ghost cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
