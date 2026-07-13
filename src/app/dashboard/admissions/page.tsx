"use client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { ShieldAlert, ShieldCheck, Upload, ScanSearch } from "lucide-react";

interface Doc { id: string; applicantName: string; type: string; elaScore: number; verdict: string; findings?: string | null; createdAt: string; }

const VERDICT: Record<string, { c: string; label: string }> = {
  clean: { c: "#0F9D58", label: "Clean — no tampering detected" },
  review: { c: "#F5A623", label: "Needs manual review" },
  forgery: { c: "#C8102E", label: "Suspected forgery" },
};

export default function AdmissionsPage() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [applicantName, setApplicantName] = useState("");
  const [type, setType] = useState("marksheet");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ verdict: string; elaScore: number; heatmap: string; findings: Record<string, unknown> } | null>(null);

  const load = () => fetch("/api/admission").then(r => r.json()).then(d => setDocs(d.documents || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const pick = (f: File | null) => { setFile(f); setResult(null); setPreview(f ? URL.createObjectURL(f) : null); };

  const verify = async () => {
    if (!file) { toast.error("Choose an image first"); return; }
    setBusy(true); setResult(null);
    const fd = new FormData();
    fd.append("image", file); fd.append("applicantName", applicantName || "Unknown Applicant"); fd.append("type", type);
    try {
      const res = await fetch("/api/admission", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) { setResult(d); toast.success("Analysed", VERDICT[d.verdict]?.label || d.verdict); load(); }
      else toast.error("Failed", d.error);
    } catch { toast.error("Failed", "Network error"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="page-hero">
        <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Admission Document Forensics</span></div>
        <div className="page-hero-sub fade-up fade-up-1">AI vision + Error-Level-Analysis flags tampered marksheets, domicile & entrance certificates before enrolment</div>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="card card-p">
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 12 }}>Verify a submitted document</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ minWidth: 200 }}>
              <label className="field-label">Applicant name</label>
              <input className="field-input" style={{ height: 38, fontSize: 13 }} value={applicantName} onChange={e => setApplicantName(e.target.value)} placeholder="e.g. Ankit Verma" />
            </div>
            <div style={{ minWidth: 160 }}>
              <label className="field-label">Document type</label>
              <select className="field-input cursor-hover" style={{ height: 38, fontSize: 13 }} value={type} onChange={e => setType(e.target.value)}>
                <option value="marksheet">Marksheet</option><option value="domicile">Domicile Certificate</option><option value="entrance">Entrance Scorecard</option>
              </select>
            </div>
            <button onClick={() => fileRef.current?.click()} className="btn btn-ghost cursor-hover" style={{ display: "flex", gap: 6, alignItems: "center" }}><Upload size={15} /> {file ? file.name.slice(0, 22) : "Choose image"}</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => pick(e.target.files?.[0] || null)} />
            <button onClick={verify} disabled={busy || !file} className="btn btn-primary cursor-hover" style={{ display: "flex", gap: 6, alignItems: "center" }}><ScanSearch size={15} /> {busy ? "Analysing…" : "Run forensics"}</button>
          </div>
          <div style={{ fontSize: 11.5, color: "#A0AEC0", marginTop: 10 }}>Runs real Error-Level-Analysis + AI vision OCR. No other university ERP does forged-document detection at admission.</div>
        </div>

        {(preview || result) && (
          <div className="card card-p">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#A0AEC0", textTransform: "uppercase", marginBottom: 6 }}>Submitted</div>
                {preview && <img src={preview} alt="submitted" style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(10,22,40,0.1)" }} />}
              </div>
              {result && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#A0AEC0", textTransform: "uppercase", marginBottom: 6 }}>ELA heatmap (bright = higher tamper signal)</div>
                  <img src={result.heatmap} alt="ela" style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(10,22,40,0.1)", background: "#000" }} />
                </div>
              )}
            </div>

            {result && (() => {
              const v = VERDICT[result.verdict] || { c: "#737373", label: result.verdict };
              const f = result.findings || {};
              const concerns = (f.authenticityConcerns as string[]) || [];
              const anomalies = (f.visualAnomalies as string[]) || [];
              const extracted = (f.extracted as Record<string, string>) || {};
              return (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${v.c}15`, color: v.c, padding: "9px 16px", borderRadius: 10, fontWeight: 800, fontSize: 14 }}>
                    {result.verdict === "clean" ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />} {v.label} · ELA score {result.elaScore}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginTop: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1565C0", textTransform: "uppercase", marginBottom: 6 }}>Extracted fields (OCR)</div>
                      {Object.keys(extracted).length === 0 && <div style={{ fontSize: 12.5, color: "#A0AEC0" }}>—</div>}
                      {Object.entries(extracted).map(([k, val]) => <div key={k} style={{ fontSize: 12.5 }}><span style={{ color: "#A0AEC0", textTransform: "capitalize" }}>{k}:</span> <b style={{ color: "#0A1628" }}>{val || "—"}</b></div>)}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#C8102E", textTransform: "uppercase", marginBottom: 6 }}>Authenticity concerns</div>
                      {concerns.length === 0 ? <div style={{ fontSize: 12.5, color: "#0F9D58" }}>None flagged.</div> : concerns.map((c, i) => <div key={i} style={{ fontSize: 12.5, color: "#374151" }}>⚠ {c}</div>)}
                      {anomalies.length > 0 && <div style={{ fontSize: 11.5, color: "#A0AEC0", marginTop: 6 }}>Visual: {anomalies.join(", ")}</div>}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 13.5, fontWeight: 800, color: "#0A1628" }}>Verification history</div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 560 }}>
              <thead><tr><th>Applicant</th><th>Type</th><th>ELA</th><th>Verdict</th><th>When</th></tr></thead>
              <tbody>
                {docs.length === 0 && <tr><td colSpan={5} style={{ color: "#A0AEC0", padding: 24, textAlign: "center" }}>No verifications yet.</td></tr>}
                {docs.map(d => {
                  const v = VERDICT[d.verdict] || { c: "#737373", label: d.verdict };
                  return <tr key={d.id}><td style={{ fontWeight: 700 }}>{d.applicantName}</td><td style={{ textTransform: "capitalize" }}>{d.type}</td><td>{d.elaScore}</td><td><span className="chip" style={{ background: `${v.c}15`, color: v.c, fontWeight: 700 }}>{d.verdict}</span></td><td style={{ fontSize: 11.5, color: "#737373" }}>{new Date(d.createdAt).toLocaleString("en-IN")}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
