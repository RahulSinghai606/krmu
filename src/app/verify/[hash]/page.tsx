"use client";
import { useEffect, useState, use } from "react";

export default function VerifyPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/verify/${hash}`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [hash]);

  const valid = data?.valid === true;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0A1628,#12417a)", padding: 24 }}>
      <div style={{ width: 460, maxWidth: "92vw", background: "white", borderRadius: 18, padding: "34px 32px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <img src="/krmu-logo.png" alt="KRMU" width={44} height={44} style={{ objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0A1628" }}>K.R. Mangalam University</div>
            <div style={{ fontSize: 11, color: "#A0AEC0" }}>Document Authenticity Verification</div>
          </div>
        </div>
        {loading ? <div style={{ color: "#A0AEC0", fontSize: 13 }}>Verifying…</div> : valid ? (
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(15,157,88,0.1)", color: "#0F9D58", padding: "7px 14px", borderRadius: 9, fontWeight: 800, fontSize: 13.5 }}>✓ AUTHENTIC — Issued by KRMU</div>
            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {[["Document", data!.type], ["Issued to", data!.studentName], ["Purpose", data!.purpose || "—"], ["Issue date", data!.issueDate], ["Signed by", data!.signedBy], ["Verification code", data!.code]].map(([k, v]) => (
                <div key={String(k)}>
                  <div style={{ fontSize: 10, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                  <div style={{ fontSize: 13.5, color: "#0A1628", fontWeight: 600 }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,16,46,0.08)", color: "#C8102E", padding: "10px 16px", borderRadius: 9, fontWeight: 800, fontSize: 13.5 }}>✕ NOT VERIFIED — No matching issued document</div>
        )}
        <div style={{ fontSize: 10.5, color: "#C4C9D4", marginTop: 22, textAlign: "center" }}>This page independently confirms documents issued by the KRMU Registrar.</div>
      </div>
    </div>
  );
}
