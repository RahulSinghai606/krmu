"use client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Ev { id: string; at: string; actor: string; role: string; kind: string; tool?: string | null; prompt: string; summary: string; tokensIn: number; tokensOut: number; latencyMs: number; grounded: boolean; refused: boolean }
interface Stats { total: number; tokensIn: number; tokensOut: number; avgLatency: number; grounded: number; refused: number; estCostUsd: number }

export default function AIOpsPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => fetch("/api/ai/events").then(r => r.json()).then(d => { setEvents(d.events || []); setStats(d.stats || null); }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const [evalRes, setEvalRes] = useState<{ summary: { total: number; passed: number; failed: number; passRate: number; byCategory: Record<string, { pass: number; total: number }> }; results: { id: string; category: string; pass: boolean; reasons: string[] }[]; ranAt: string } | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const runEval = async () => {
    setEvaluating(true);
    try { const res = await fetch("/api/ai/eval", { method: "POST" }); setEvalRes(await res.json()); }
    catch { /* */ } finally { setEvaluating(false); }
  };

  const groundRate = stats && stats.total ? Math.round((stats.grounded / stats.total) * 100) : 0;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Governance</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Observability over every AI interaction — cost, latency, grounding, refusals · auto-refresh 15s</div>
          </div>
          <button onClick={load} className="btn btn-sm cursor-hover" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>Refresh</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 }}>
          {loading || !stats ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="card card-p"><Skeleton h={50} /></div>) : [
            { label: "AI Interactions", value: stats.total, color: "#0A1628" },
            { label: "Grounding Rate", value: `${groundRate}%`, color: groundRate >= 70 ? "#0F9D58" : "#F5A623" },
            { label: "Refusals", value: stats.refused, color: "#1565C0" },
            { label: "Avg Latency", value: `${(stats.avgLatency / 1000).toFixed(1)}s`, color: "#0A1628" },
            { label: "Est. Spend", value: `$${stats.estCostUsd}`, color: "#0F9D58" },
          ].map(k => (
            <div key={k.label} className="card card-p">
              <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: "-0.04em", marginTop: 6 }}>{k.value}</div>
            </div>
          ))}
        </div>

        {stats && (
          <div style={{ fontSize: 11.5, color: "#737373", marginBottom: 16 }}>
            Tokens — in <strong>{stats.tokensIn.toLocaleString("en-IN")}</strong> · out <strong>{stats.tokensOut.toLocaleString("en-IN")}</strong>. Cost is indicative (Azure GPT-5.4 blended rate). All AI data resides in-region per §6.5.
          </div>
        )}

        {/* Evaluation harness */}
        <div className="card card-p" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: evalRes ? 14 : 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Safety & Quality Evaluation</div>
              <div style={{ fontSize: 11.5, color: "#A0AEC0", marginTop: 2 }}>Automated suite — grounding, accuracy, prompt-injection, PII, scope. Run before/after AI changes (§6.3.5).</div>
            </div>
            <button onClick={runEval} disabled={evaluating} className="btn btn-primary btn-sm cursor-hover">{evaluating ? "Running suite…" : "Run evaluation"}</button>
          </div>
          {evalRes && (
            <>
              <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: evalRes.summary.passRate >= 90 ? "#0F9D58" : evalRes.summary.passRate >= 70 ? "#F5A623" : "#C8102E" }}>{evalRes.summary.passRate}%</div>
                <div style={{ fontSize: 12.5, color: "#525252" }}>{evalRes.summary.passed}/{evalRes.summary.total} passed · {evalRes.summary.failed} failed</div>
                <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                  {Object.entries(evalRes.summary.byCategory).map(([c, v]) => (
                    <span key={c} className={`chip ${v.pass === v.total ? "chip-green" : "chip-red"}`}>{c} {v.pass}/{v.total}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {evalRes.results.map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, background: r.pass ? "rgba(15,157,88,0.06)" : "rgba(200,16,46,0.06)" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: r.pass ? "#0F9D58" : "#C8102E" }}>{r.pass ? "PASS" : "FAIL"}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0A1628", fontFamily: "monospace" }}>{r.id}</span>
                    {!r.pass && <span style={{ fontSize: 11.5, color: "#C8102E" }}>{r.reasons.join("; ")}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Recent AI Activity</div>
          {loading ? <div style={{ padding: 16 }}><Skeleton h={180} /></div> : (
            <table className="tbl">
              <thead><tr><th>Time</th><th>User</th><th>Prompt</th><th>Tools</th><th>Tokens</th><th>Latency</th><th>Flags</th></tr></thead>
              <tbody>
                {events.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#A0AEC0", padding: 28 }}>No AI activity logged yet. Ask the assistant something.</td></tr>}
                {events.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontSize: 11.5, color: "#737373", whiteSpace: "nowrap" }}>{new Date(e.at).toLocaleTimeString("en-IN")}</td>
                    <td style={{ fontSize: 11.5 }}><div style={{ fontWeight: 600 }}>{e.role}</div><div style={{ color: "#A0AEC0", fontFamily: "monospace", fontSize: 10 }}>{e.actor}</div></td>
                    <td style={{ fontSize: 12, maxWidth: 240 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.prompt}</div></td>
                    <td style={{ fontSize: 11 }}>{e.tool ? <span style={{ fontFamily: "monospace", color: "#1565C0" }}>{e.tool}</span> : <span style={{ color: "#C4C9D4" }}>—</span>}</td>
                    <td style={{ fontSize: 11, color: "#737373" }}>{e.tokensIn + e.tokensOut}</td>
                    <td style={{ fontSize: 11, color: "#737373" }}>{(e.latencyMs / 1000).toFixed(1)}s</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {e.grounded && <span title="Grounded in data" style={{ fontSize: 9, fontWeight: 700, color: "#0F9D58", background: "rgba(15,157,88,0.12)", padding: "1px 6px", borderRadius: 4 }}>GROUNDED</span>}
                        {e.refused && <span title="Refused (guardrail)" style={{ fontSize: 9, fontWeight: 700, color: "#C8102E", background: "rgba(200,16,46,0.1)", padding: "1px 6px", borderRadius: 4 }}>REFUSED</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
