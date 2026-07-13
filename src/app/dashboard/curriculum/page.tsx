"use client";
import { useState } from "react";
import { COURSES, PROGRAMMES, SCHOOLS } from "@/lib/data";

export default function CurriculumPage() {
  const [prog, setProg] = useState("B.Tech CSE");
  const courses = COURSES.filter(c => c.programme === prog);
  const bySem = courses.reduce((acc, c) => { (acc[c.semester] ||= []).push(c); return acc; }, {} as Record<number, typeof COURSES>);
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);

  const allProgs = Array.from(new Set(Object.values(PROGRAMMES).flat()));

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Curriculum & Programme Structure</span></div>
            <div className="page-hero-sub fade-up fade-up-1">NEP 2020 aligned · CBCS · {SCHOOLS.length} schools · 34 programmes</div>
          </div>
          <select value={prog} onChange={e => setProg(e.target.value)} className="field-input cursor-hover" style={{ width: 200, height: 36, background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
            {allProgs.map(p => <option key={p} style={{ color: "#0A1628" }}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total Courses", value: courses.length },
            { label: "Total Credits", value: totalCredits || "—" },
            { label: "Core", value: courses.filter(c => c.type === "core").length },
            { label: "Electives", value: courses.filter(c => c.type === "elective").length },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "14px 20px", flex: 1 }}>
              <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.04em", marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {courses.length === 0 ? (
          <div className="card card-p" style={{ textAlign: "center", color: "#A0AEC0", padding: 48 }}>
            Course scheme for <strong style={{ color: "#0A1628" }}>{prog}</strong> is being digitized. Sample scheme available for B.Tech CSE.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(bySem).sort(([a], [b]) => +a - +b).map(([sem, list]) => (
              <div key={sem} className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", background: "#1565C0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Semester {sem}</span>
                  <span style={{ fontSize: 11, color: "#F5A623", fontWeight: 700 }}>{list.reduce((s, c) => s + c.credits, 0)} credits · {list.length} courses</span>
                </div>
                <table className="tbl">
                  <thead><tr><th>Code</th><th>Course Title</th><th>Type</th><th>Credits</th><th>Contact Hrs</th><th>Faculty</th></tr></thead>
                  <tbody>
                    {list.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 11.5, fontWeight: 700 }}>{c.code}</td>
                        <td style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</td>
                        <td><span className={`chip ${c.type === "core" ? "chip-blue" : "chip-amber"}`}>{c.type}</span></td>
                        <td style={{ fontWeight: 800 }}>{c.credits}</td>
                        <td style={{ fontSize: 12.5 }}>{c.contactHours} hrs</td>
                        <td style={{ fontSize: 12, color: "#737373" }}>{c.faculty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
