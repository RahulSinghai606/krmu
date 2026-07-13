"use client";
import { useState } from "react";
import { CERTIFICATE_REQUESTS } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { useApp } from "@/lib/store";

const CERT_TYPES = [
  { type: "Bonafide Certificate", desc: "Proof of enrolment for scholarships, banks, visa", tat: "2 days" },
  { type: "Transcript", desc: "Official semester-wise grade records", tat: "5 days" },
  { type: "Degree Certificate", desc: "Final degree on programme completion", tat: "15 days" },
  { type: "Migration Certificate", desc: "For transfer to another university", tat: "7 days" },
  { type: "Character Certificate", desc: "Conduct certificate on graduation", tat: "3 days" },
  { type: "Provisional Certificate", desc: "Issued before degree convocation", tat: "5 days" },
];

export default function CertificatesPage() {
  const [tab, setTab] = useState<"requests"|"catalogue">("requests");
  const { user } = useApp();
  const isStudent = user?.role === "student";
  // Students only see their own requests; staff see the institution issuance queue.
  const rows = isStudent ? CERTIFICATE_REQUESTS.filter(c => c.studentName === user?.name) : CERTIFICATE_REQUESTS;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Certificate & Document Issuance</span></div>
            <div className="page-hero-sub fade-up fade-up-1">{isStudent ? "Request and track your own certificates · digitally-signed · QR-verifiable" : "Digitally-signed · QR-verifiable · institution issuance queue"}</div>
          </div>
          <button className="btn btn-gold btn-sm cursor-hover">+ New Request</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: isStudent ? "My Issued" : "Issued (30d)", value: rows.filter(c => c.status === "issued").length, color: "#0F9D58" },
            { label: "Processing", value: rows.filter(c => c.status === "processing").length, color: "#F5A623" },
            { label: "Avg Turnaround", value: "2.8 days", color: "white" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderBottom: "1px solid rgba(10,22,40,0.07)", padding: "0 24px", display: "flex", gap: 28, flexShrink: 0 }}>
        {([["requests", isStudent ? "My Requests" : "Requests"],["catalogue","Document Catalogue"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className="cursor-hover"
            style={{ padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none",
              color: tab === t ? "#0A1628" : "#737373", borderBottom: tab === t ? "2px solid #0A1628" : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {tab === "requests" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead><tr><th>Request ID</th>{!isStudent && <th>Student</th>}<th>Document Type</th><th>Purpose</th><th>Requested</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={isStudent ? 6 : 7} style={{ textAlign: "center", color: "#A0AEC0", padding: 28 }}>No certificate requests yet. Use “+ New Request”.</td></tr>}
                {rows.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{c.id.toUpperCase()}</td>
                    {!isStudent && <td style={{ fontWeight: 700, fontSize: 13 }}>{c.studentName}</td>}
                    <td style={{ fontSize: 12.5 }}>{c.type}</td>
                    <td style={{ fontSize: 12.5, color: "#737373" }}>{c.purpose}</td>
                    <td style={{ fontSize: 12 }}>{formatDate(c.requestDate)}</td>
                    <td><span className={`chip ${c.status === "issued" ? "chip-green" : "chip-blue"}`}>{c.status}</span></td>
                    <td>
                      {c.status === "issued"
                        ? <button className="btn btn-sm btn-ghost cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Download PDF</button>
                        : isStudent
                          ? <span style={{ fontSize: 11, color: "#A0AEC0" }}>In process</span>
                          : <button className="btn btn-sm btn-blue cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Issue Now</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "catalogue" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {CERT_TYPES.map(c => (
              <div key={c.type} className="card cursor-hover" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(21,101,192,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#0F9D58", background: "rgba(15,157,88,0.1)", padding: "3px 8px", borderRadius: 5 }}>TAT {c.tat}</span>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{c.type}</div>
                <div style={{ fontSize: 12, color: "#737373", marginTop: 6, lineHeight: 1.5 }}>{c.desc}</div>
                <button className="btn btn-sm btn-primary cursor-hover" style={{ marginTop: 14, width: "100%" }}>Request</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
