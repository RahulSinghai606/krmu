"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { CERT_TYPES } from "@/lib/certificates";
import { printCertificate } from "@/lib/pdf";
import { FileText, Download, ShieldCheck, Clock, Ban } from "lucide-react";

interface Req { id: string; studentName: string; type: string; purpose: string; requestDate: string; status: string; issueDate?: string | null; hash?: string | null; holdReasons?: string | null; }

const STATUS: Record<string, { c: string; label: string }> = {
  issued: { c: "#0F9D58", label: "Issued & Signed" },
  pending: { c: "#F5A623", label: "Pending Signature" },
  "on-hold": { c: "#C8102E", label: "On Hold" },
  rejected: { c: "#C8102E", label: "Rejected" },
  processing: { c: "#1565C0", label: "Processing" },
};

export default function CertificatesPage() {
  const { user } = useApp();
  const toast = useToast();
  const isStudent = user?.role === "student";
  const [rows, setRows] = useState<Req[]>([]);
  const [type, setType] = useState(CERT_TYPES[0]);
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/certificates").then(r => r.json()).then(d => setRows(d.requests || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const request = async () => {
    setBusy(true);
    const res = await fetch("/api/certificates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, purpose }) });
    const d = await res.json();
    setBusy(false);
    if (res.ok) { setPurpose(""); load(); if (d.eligibility?.clear) toast.success("Request filed", "Pending registrar signature"); else toast.error("Filed but on hold", (d.eligibility?.reasons || []).join(", ")); }
    else toast.error("Failed", d.error);
  };

  const act = async (id: string, action: "issue" | "reject") => {
    const res = await fetch("/api/certificates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reason: action === "reject" ? "Rejected by registrar" : undefined }) });
    const d = await res.json();
    if (res.ok && d.blocked) toast.error("Cannot issue — holds", (d.reasons || []).join(", "));
    else if (res.ok) toast.success(action === "issue" ? "Issued & signed" : "Rejected", d.hash ? `Verify code ${d.hash}` : "");
    else toast.error("Failed", d.error);
    load();
  };

  const download = (r: Req) => printCertificate({ type: r.type, studentName: r.studentName, purpose: r.purpose, issueDate: r.issueDate, hash: r.hash });

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="page-hero">
        <div className="reveal-wrap"><span className="reveal-inner page-hero-title">{isStudent ? "Request a Certificate" : "Certificate Issuance"}</span></div>
        <div className="page-hero-sub fade-up fade-up-1">AI-assisted issuance · eligibility auto-checked · digitally signed & verifiable{isStudent ? " · turnaround in minutes" : ""}</div>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        {isStudent && (
          <div className="card card-p">
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 12 }}>New request</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ minWidth: 220 }}>
                <label className="field-label">Certificate type</label>
                <select className="field-input cursor-hover" style={{ height: 38, fontSize: 13 }} value={type} onChange={e => setType(e.target.value)}>
                  {CERT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="field-label">Purpose</label>
                <input className="field-input" style={{ height: 38, fontSize: 13 }} placeholder="e.g. visa application, bank loan" value={purpose} onChange={e => setPurpose(e.target.value)} />
              </div>
              <button onClick={request} disabled={busy} className="btn btn-primary cursor-hover" style={{ display: "flex", gap: 6, alignItems: "center" }}><FileText size={15} /> {busy ? "Filing…" : "File request"}</button>
            </div>
            <div style={{ fontSize: 11.5, color: "#A0AEC0", marginTop: 10 }}>Tip: you can also just ask the AI — “I need a bonafide certificate for my visa.”</div>
          </div>
        )}

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", fontSize: 13.5, fontWeight: 800, color: "#0A1628" }}>{isStudent ? "My requests" : "Issuance queue"}</div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 700 }}>
              <thead><tr><th>Type</th>{!isStudent && <th>Student</th>}<th>Purpose</th><th>Requested</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={6} style={{ color: "#A0AEC0", padding: 24, textAlign: "center" }}>No requests yet.</td></tr>}
                {rows.map(r => {
                  const st = STATUS[r.status] || { c: "#737373", label: r.status };
                  const holds = r.holdReasons ? JSON.parse(r.holdReasons) : [];
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{r.type}</td>
                      {!isStudent && <td>{r.studentName}</td>}
                      <td style={{ color: "#525252" }}>{r.purpose || "—"}</td>
                      <td>{r.requestDate}</td>
                      <td>
                        <span className="chip" style={{ background: `${st.c}15`, color: st.c, fontWeight: 700 }}>{st.label}</span>
                        {holds.length > 0 && <div style={{ fontSize: 10.5, color: "#C8102E", marginTop: 3 }}>{holds.join(", ")}</div>}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {r.status === "issued" && <button onClick={() => download(r)} className="btn btn-ghost btn-sm cursor-hover" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><Download size={13} /> PDF</button>}
                        {!isStudent && (r.status === "pending" || r.status === "on-hold") && <>
                          <button onClick={() => act(r.id, "issue")} className="btn btn-primary btn-sm cursor-hover" style={{ display: "inline-flex", gap: 4, alignItems: "center", marginRight: 6 }}><ShieldCheck size={13} /> Issue & Sign</button>
                          <button onClick={() => act(r.id, "reject")} className="btn btn-ghost btn-sm cursor-hover"><Ban size={13} /></button>
                        </>}
                        {isStudent && r.status === "pending" && <span style={{ fontSize: 11.5, color: "#A0AEC0", display: "inline-flex", gap: 4, alignItems: "center" }}><Clock size={12} /> awaiting registrar</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
