"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface WF { key: string; name: string; description: string; needsInput: { field: string; label: string }[] }
interface RunResult { brief: string; findings: unknown; prepared: { id: string; summary: string }[]; sources: string[] }

export default function WorkflowsPage() {
  const { user } = useApp();
  const toast = useToast();
  const [wfs, setWfs] = useState<WF[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<{ wf: WF; data: RunResult } | null>(null);
  const [inputFor, setInputFor] = useState<WF | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => { fetch("/api/ai/workflows").then(r => r.json()).then(d => setWfs(d.workflows || [])).catch(() => {}); }, []);

  const run = async (wf: WF, input: Record<string, string> = {}) => {
    setRunning(wf.key); setInputFor(null);
    try {
      const res = await fetch("/api/ai/workflows", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: wf.key, input, role: user?.role, email: user?.email }),
      });
      const data = await res.json();
      if (res.ok) { setResult({ wf, data }); toast.success(`${wf.name} complete`, data.prepared?.length ? `${data.prepared.length} action(s) sent for approval` : "Review the findings below"); }
      else toast.error("Workflow failed", data.error);
    } catch { toast.error("Workflow failed", "Network error"); }
    finally { setRunning(null); }
  };

  const start = (wf: WF) => { if (wf.needsInput.length) { setForm({}); setInputFor(wf); } else run(wf); };
  const findings = result?.data.findings;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div className="reveal-wrap"><span className="reveal-inner page-hero-title">AI Workflows</span></div>
        <div className="page-hero-sub fade-up fade-up-1">Agentic automation · the agent prepares & proposes — you approve before anything takes effect</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
          {wfs.map(wf => (
            <div key={wf.key} className="card card-p" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #1f6fd6, #1250a6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6M7 12H1"/></svg>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{wf.name}</div>
              <div style={{ fontSize: 12, color: "#737373", marginTop: 5, lineHeight: 1.5, flex: 1 }}>{wf.description}</div>
              <button onClick={() => start(wf)} disabled={running === wf.key} className="btn btn-primary btn-sm cursor-hover" style={{ marginTop: 14, width: "100%" }}>
                {running === wf.key ? "Running…" : "Run workflow"}
              </button>
            </div>
          ))}
        </div>

        {result && (
          <div className="card card-p" style={{ borderTop: "3px solid #F5A623" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0A1628" }}>{result.wf.name} — result</div>
              {result.data.prepared?.length > 0 && <Link href="/dashboard/approvals" className="btn btn-gold btn-sm cursor-hover" style={{ textDecoration: "none" }}>Review {result.data.prepared.length} approval(s) →</Link>}
            </div>
            <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: result.data.brief.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/`(.*?)`/g, "<code>$1</code>") }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
              {result.data.sources.map(s => <span key={s} style={{ fontSize: 10.5, color: "#A0AEC0", background: "#F7F7F5", padding: "2px 8px", borderRadius: 5 }}>📎 {s}</span>)}
            </div>
            {Array.isArray(findings) && findings.length > 0 && (
              <div className="card" style={{ overflow: "hidden", marginTop: 12 }}>
                <table className="tbl">
                  <thead><tr>{Object.keys(findings[0] as object).map(k => <th key={k}>{k}</th>)}</tr></thead>
                  <tbody>
                    {(findings as Record<string, unknown>[]).slice(0, 30).map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={{ fontSize: 12.5 }}>{String(v)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {findings && typeof findings === "object" && !Array.isArray(findings) && (findings as { draft?: string }).draft && (
              <pre style={{ marginTop: 12, padding: 16, background: "#F7F7F5", borderRadius: 10, fontSize: 12.5, whiteSpace: "pre-wrap", fontFamily: "inherit", color: "#374151", lineHeight: 1.6 }}>{(findings as { draft: string }).draft}</pre>
            )}
          </div>
        )}
      </div>

      <Modal open={!!inputFor} onClose={() => setInputFor(null)} title={inputFor?.name} subtitle="Provide a few details for the agent"
        footer={<><button onClick={() => setInputFor(null)} className="btn btn-ghost cursor-hover">Cancel</button><button onClick={() => inputFor && run(inputFor, form)} className="btn btn-primary cursor-hover">Run</button></>}>
        {inputFor?.needsInput.map(f => (
          <div key={f.field} style={{ marginBottom: 12 }}>
            <label className="field-label">{f.label}</label>
            <input value={form[f.field] || ""} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} className="field-input" style={{ height: 38 }} />
          </div>
        ))}
      </Modal>
    </div>
  );
}
