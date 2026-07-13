"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface Pred { id: string; kind: string; subjectId: string; subject: string; score: number; band: string; basis: string; confidence: number; at: string }

const KIND_META: Record<string, { title: string; desc: string }> = {
  dropout_risk: { title: "Student Dropout / At-Risk", desc: "Risk of failing or dropping out — act early" },
  attendance_shortfall: { title: "Attendance Shortfall", desc: "Trending toward the 75% debarment threshold" },
  fee_forecast: { title: "Fee Collection Forecast", desc: "Projected collection against dues" },
  result_trend: { title: "Result Trend", desc: "Pass-rate movement by course group" },
  enrolment: { title: "Enrolment Forecast", desc: "Projected next-year enrolment" },
};
const bandColor = (b: string) => /high|at-risk|decline|watch/.test(b) ? "#C8102E" : /medium/.test(b) ? "#F5A623" : "#0F9D58";

export default function PredictionsPage() {
  const toast = useToast();
  const [byKind, setByKind] = useState<Record<string, Pred[]>>({});
  const [genAt, setGenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = () => fetch("/api/ai/predictions").then(r => r.json()).then(d => { setByKind(d.byKind || {}); setGenAt(d.generatedAt); }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const run = async () => {
    setRunning(true);
    try { const res = await fetch("/api/ai/predictions", { method: "POST" }); const d = await res.json(); if (res.ok) { await load(); toast.success("Predictions refreshed", `${d.generated} forecasts generated`); } else toast.error("Failed", d.error); }
    catch { toast.error("Failed", "Network error"); } finally { setRunning(false); }
  };

  const fmtVal = (p: Pred) => p.kind === "fee_forecast" || p.kind === "enrolment" ? p.score.toLocaleString("en-IN") : `${Math.round(p.score * 100)}%`;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Predictions</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Advisory forecasts · explainable, labelled, back-testable · {genAt ? `updated ${new Date(genAt).toLocaleString("en-IN")}` : "not yet generated"}</div>
          </div>
          <button onClick={run} disabled={running} className="btn btn-gold btn-sm cursor-hover">{running ? "Computing…" : "Generate forecasts"}</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ padding: "10px 14px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 10, fontSize: 12.5, color: "#b45309", marginBottom: 20 }}>
          ⚠ These are <strong>predictions, not facts</strong>. They direct attention; no action is ever taken on a person from a prediction alone (§6.4). Each carries its confidence and the inputs that produced it.
        </div>

        {!loading && Object.keys(byKind).length > 0 && (() => {
          const all = Object.values(byKind).flat();
          const flagged = all.filter(p => /high|at-risk|decline|watch|medium/.test(p.band)).length;
          const avgConf = Math.round((all.reduce((s, p) => s + p.confidence, 0) / all.length) * 100);
          const tiles = [
            { label: "Active forecasts", value: all.length, color: "#1565C0" },
            { label: "Flagged for attention", value: flagged, color: "#C8102E" },
            { label: "Avg confidence", value: `${avgConf}%`, color: "#0F9D58" },
            { label: "Forecast models", value: Object.keys(byKind).length, color: "#9C27B0" },
          ];
          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
              {tiles.map(t => (
                <div key={t.label} className="card card-p">
                  <div style={{ fontSize: 24, fontWeight: 800, color: t.color, letterSpacing: "-0.03em" }}>{t.value}</div>
                  <div style={{ fontSize: 12, color: "#737373", marginTop: 2 }}>{t.label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {loading ? <div className="card card-p"><Skeleton h={200} /></div> : Object.keys(byKind).length === 0 ? (
          <div className="card card-p" style={{ textAlign: "center", padding: 48, color: "#A0AEC0" }}>No forecasts yet. Click <strong>Generate forecasts</strong>.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {Object.entries(KIND_META).map(([kind, meta]) => {
              const rows = byKind[kind] || [];
              if (!rows.length) return null;
              return (
                <div key={kind} className="card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>{meta.title} <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1565C0", background: "rgba(21,101,192,0.1)", padding: "1px 7px", borderRadius: 5, marginLeft: 6 }}>PREDICTION</span></div>
                    <div style={{ fontSize: 11.5, color: "#A0AEC0", marginTop: 2 }}>{meta.desc}</div>
                  </div>
                  <div>
                    {rows.slice(0, 12).map(p => {
                      const c = bandColor(p.band);
                      const isOpen = open === p.id;
                      const conf = Math.round(p.confidence * 100);
                      const isPct = !(p.kind === "fee_forecast" || p.kind === "enrolment");
                      let basisObj: Record<string, unknown> = {};
                      try { basisObj = JSON.parse(p.basis); } catch { /* basis may be plain text */ }
                      return (
                        <div key={p.id} onClick={() => setOpen(isOpen ? null : p.id)} className="cursor-hover"
                          style={{ padding: "13px 18px", borderBottom: "1px solid rgba(10,22,40,0.05)", transition: "background 0.15s", background: isOpen ? "rgba(21,101,192,0.03)" : "transparent" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>{p.subject}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 7, flexWrap: "wrap" }}>
                                <span className="chip" style={{ background: `${c}15`, color: c, fontSize: 10.5, fontWeight: 700 }}>{p.band}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ width: 84, height: 5, borderRadius: 3, background: "#EEF3FB", overflow: "hidden" }}>
                                    <div style={{ width: `${conf}%`, height: "100%", borderRadius: 3, background: conf >= 70 ? "#0F9D58" : conf >= 50 ? "#F5A623" : "#C8102E", transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
                                  </div>
                                  <span style={{ fontSize: 10.5, color: "#A0AEC0" }}>{conf}% confidence</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right", minWidth: 132 }}>
                              <div style={{ fontSize: 19, fontWeight: 800, color: c, letterSpacing: "-0.02em", lineHeight: 1 }}>{fmtVal(p)}</div>
                              {isPct && (
                                <div style={{ width: 120, height: 5, borderRadius: 3, background: "#EEF3FB", marginTop: 6, marginLeft: "auto", overflow: "hidden" }}>
                                  <div style={{ width: `${Math.min(100, Math.round(p.score * 100))}%`, height: "100%", borderRadius: 3, background: c, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
                                </div>
                              )}
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
                          </div>
                          {isOpen && (
                            <div style={{ marginTop: 12, padding: 14, background: "#F7FAFF", borderRadius: 10, border: "1px solid rgba(21,101,192,0.12)" }} onClick={e => e.stopPropagation()}>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1565C0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Why this prediction — inputs</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                                {Object.entries(basisObj).map(([k, v]) => (
                                  <div key={k}>
                                    <div style={{ color: "#A0AEC0", fontSize: 10, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</div>
                                    <div style={{ color: "#374151", fontWeight: 600, fontSize: 12.5 }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                                  </div>
                                ))}
                                {Object.keys(basisObj).length === 0 && <div style={{ fontSize: 12, color: "#737373" }}>{p.basis}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
