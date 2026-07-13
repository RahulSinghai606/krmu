"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GatePage() {
  return <Suspense fallback={null}><GateInner /></Suspense>;
}

function GateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(false);
    const res = await fetch("/api/gate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) { router.replace(params.get("next") || "/"); }
    else { setError(true); setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0A1628 0%, #12417a 100%)", padding: 24 }}>
      <div style={{ width: 400, maxWidth: "92vw", background: "white", borderRadius: 20, padding: "38px 36px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", textAlign: "center" }}>
        <img src="/krmu-logo.png" alt="KRMU" width={62} height={62} style={{ objectFit: "contain", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.03em" }}>K.R. Mangalam University</div>
        <div style={{ fontSize: 12.5, color: "#A0AEC0", marginTop: 4 }}>AI-Native ERP · Private Preview</div>

        <form onSubmit={submit} style={{ marginTop: 26 }}>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter access password"
            autoFocus
            style={{
              width: "100%", height: 46, borderRadius: 11, padding: "0 16px", fontSize: 14,
              border: `1.5px solid ${error ? "#C8102E" : "rgba(10,22,40,0.14)"}`, outline: "none",
              textAlign: "center", letterSpacing: "0.05em",
            }}
          />
          {error && <div style={{ color: "#C8102E", fontSize: 12.5, marginTop: 10 }}>Incorrect password. Try again.</div>}
          <button type="submit" disabled={busy || !password} style={{
            width: "100%", height: 46, marginTop: 16, borderRadius: 11, border: "none", cursor: "pointer",
            background: busy ? "#94a2b8" : "linear-gradient(135deg, #1f6fd6, #1250a6)", color: "white",
            fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em",
          }}>{busy ? "Verifying…" : "Enter"}</button>
        </form>
        <div style={{ fontSize: 11, color: "#C4C9D4", marginTop: 20 }}>Authorized access only · content is confidential</div>
      </div>
    </div>
  );
}
