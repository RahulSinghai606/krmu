"use client";
import { ACCREDITATION_DATA } from "@/lib/data";

export default function AccreditationPage() {
  const { naac, nirf, aishe, ugc } = ACCREDITATION_DATA;

  const REPORTS = [
    { name: "NAAC SSR", body: "National Assessment & Accreditation Council", status: "Submitted", cycle: "Cycle 1 (2023)", color: "#0F9D58" },
    { name: "NIRF Data Capture", body: "National Institutional Ranking Framework", status: "Submitted", cycle: "2024", color: "#0F9D58" },
    { name: "AISHE Survey", body: "All India Survey on Higher Education", status: "Submitted", cycle: "2023-24", color: "#0F9D58" },
    { name: "NBA Programme Accreditation", body: "National Board of Accreditation", status: "In Progress", cycle: "B.Tech CSE, ECE, ME", color: "#F5A623" },
    { name: "UGC Annual Return", body: "University Grants Commission", status: "Due Feb 2025", cycle: "2024-25", color: "#C8102E" },
  ];

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Accreditation & Statutory Reporting</span></div>
        <div className="page-hero-sub fade-up fade-up-1">NAAC · NIRF · AISHE · NBA · UGC compliance dashboard</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {/* Accreditation badges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div className="card card-asym-a" style={{ padding: "22px 20px", background: "linear-gradient(135deg, #1f6fd6, #1250a6)", color: "white" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: "0.08em" }}>NAAC GRADE</div>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, margin: "8px 0", color: "#F5A623" }}>{naac.grade}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>CGPA {naac.cgpa}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Valid till {naac.nextReview}</div>
          </div>
          <div className="card" style={{ padding: "22px 20px" }}>
            <div style={{ fontSize: 11, color: "#A0AEC0", fontWeight: 700, letterSpacing: "0.08em" }}>NIRF RANK</div>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, margin: "8px 0", color: "#1565C0" }}>#{nirf.rank}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>{nirf.category}</div>
            <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 4 }}>Ranking year {nirf.year}</div>
          </div>
          <div className="card" style={{ padding: "22px 20px" }}>
            <div style={{ fontSize: 11, color: "#A0AEC0", fontWeight: 700, letterSpacing: "0.08em" }}>AISHE CODE</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, margin: "12px 0 8px", color: "#0A1628" }}>{aishe.collegeCode}</div>
            <span className="chip chip-green">{aishe.status}</span>
            <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 8 }}>Last: {aishe.lastSubmission}</div>
          </div>
          <div className="card" style={{ padding: "22px 20px" }}>
            <div style={{ fontSize: 11, color: "#A0AEC0", fontWeight: 700, letterSpacing: "0.08em" }}>UGC STATUS</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, margin: "12px 0 10px", color: "#0A1628" }}>{ugc.status}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ugc.recognitions.map(r => <div key={r} style={{ fontSize: 10.5, color: "#525252" }}>✓ {r}</div>)}
            </div>
          </div>
        </div>

        {/* Reporting status */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Statutory Reporting Status</div>
          <table className="tbl">
            <thead><tr><th>Report</th><th>Regulatory Body</th><th>Cycle / Scope</th><th>Status</th></tr></thead>
            <tbody>
              {REPORTS.map(r => (
                <tr key={r.name}>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</td>
                  <td style={{ fontSize: 12, color: "#737373" }}>{r.body}</td>
                  <td style={{ fontSize: 12.5 }}>{r.cycle}</td>
                  <td><span className="chip" style={{ background: `${r.color}15`, color: r.color }}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card-p" style={{ marginTop: 20, borderLeft: "3px solid #F5A623", background: "rgba(245,166,35,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>⚡ AI Compliance Alert</div>
          <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.55 }}>UGC Annual Return for 2024-25 is due February 2025. Required data — faculty count, enrolment, research output, financials — is 87% auto-populated from ERP. Ask the AI assistant to draft the submission package.</p>
        </div>
      </div>
    </div>
  );
}
