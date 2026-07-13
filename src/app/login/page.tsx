"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { useApp } from "@/lib/store";

const ROLES: { role: UserRole; label: string; desc: string; color: string }[] = [
  { role: "admin",         label: "System Admin",    desc: "Full access",          color: "#0A1628" },
  { role: "registrar",     label: "Registrar",       desc: "Registry & Records",   color: "#1565C0" },
  { role: "dean",          label: "Dean",            desc: "School oversight",      color: "#0F9D58" },
  { role: "hod",           label: "Head of Dept",    desc: "Department head",       color: "#9C27B0" },
  { role: "faculty",       label: "Faculty",         desc: "Teaching & assessment", color: "#F5A623" },
  { role: "student",       label: "Student",         desc: "Student portal",        color: "#1565C0" },
  { role: "finance",       label: "Finance Officer", desc: "Fees & accounts",       color: "#C8102E" },
  { role: "exam_officer",  label: "Exam Officer",    desc: "Examinations",          color: "#FF5722" },
];

function LoginInner() {
  const { login } = useApp();
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole>("admin");
  const [email, setEmail] = useState("admin@krmu.edu.in");
  const [password, setPassword] = useState("krmu@2025");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"role" | "creds">("role");

  const handleRoleSelect = (role: UserRole) => {
    setSelected(role);
    const emailMap: Record<UserRole, string> = {
      admin: "alok.tiwari@krmu.edu.in",
      registrar: "shobha.nair@krmu.edu.in",
      dean: "sk.pandey@krmu.edu.in",
      hod: "rajeev.sharma@krmu.edu.in",
      faculty: "kavitha.reddy@krmu.edu.in",
      student: "priya.sharma@krmu.edu.in",
      finance: "deepak.jain@krmu.edu.in",
      hostel_warden: "anita.rawat@krmu.edu.in",
      exam_officer: "vikas.chandra@krmu.edu.in",
    };
    setEmail(emailMap[role]);
    setStep("creds");
  };

  const handleLogin = async () => {
    setLoading(true);
    await login(selected);          // sets the server session cookie before we navigate
    router.push("/dashboard");
  };

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh", display: "flex" }}>
      {/* LEFT — editorial hero */}
      <div
        className="login-hero"
        style={{
          width: "55%",
          background: "var(--color-navy)",
          flexShrink: 0,
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: 40,
          padding: 48,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Noise texture overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
          opacity: 0.4, pointerEvents: "none", zIndex: 0,
        }} />

        {/* Radial glows */}
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", bottom: "-15%", left: "20%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(21,101,192,0.08) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo mark */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src="/krmu-logo.png" alt="K.R. Mangalam University" width={52} height={52}
              style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>K.R. Mangalam University</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Enterprise Resource Platform</div>
            </div>
          </div>
        </div>

        {/* Giant headline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <div className="reveal-wrap">
              <span className="reveal-inner" style={{
                display: "block",
                fontSize: "clamp(3.5rem, 6.5vw, 6rem)",
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.88,
                color: "white",
              }}>
                One
              </span>
            </div>
            <div className="reveal-wrap">
              <span className="reveal-inner reveal-delay-1" style={{
                display: "block",
                fontSize: "clamp(3.5rem, 6.5vw, 6rem)",
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.88,
                color: "white",
              }}>
                Platform.
              </span>
            </div>
            <div className="reveal-wrap" style={{ marginTop: 12 }}>
              <span className="reveal-inner reveal-delay-2" style={{
                display: "block",
                fontSize: "clamp(3.5rem, 6.5vw, 6rem)",
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.88,
                color: "#F5A623",
              }}>
                Every
              </span>
            </div>
            <div className="reveal-wrap">
              <span className="reveal-inner reveal-delay-3" style={{
                display: "block",
                fontSize: "clamp(3.5rem, 6.5vw, 6rem)",
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.88,
                color: "#F5A623",
              }}>
                Process.
              </span>
            </div>
          </div>

          <div className="fade-up fade-up-4" style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 400, lineHeight: 1.6 }}>
            AI-native ERP built for K.R. Mangalam University — consolidating academics, finance, HR, and operations into a single source of truth.
          </div>

          {/* Stats row */}
          <div className="fade-up fade-up-5" style={{ display: "flex", gap: 32, marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { n: "3,842", l: "Students" },
              { n: "186", l: "Faculty" },
              { n: "19", l: "Modules" },
              { n: "34", l: "Programmes" },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "white", lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Success tag */}
        <div style={{ position: "relative", zIndex: 1, marginTop: "auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5A623" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Destination Success</span>
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, minHeight: "100vh", position: "relative" }}>
        {/* Mobile logo — only when hero panel is hidden */}
        <div className="login-mobile-logo" style={{ alignItems: "center", gap: 12, marginBottom: 32 }}>
          <img src="/krmu-logo.png" alt="KRMU" width={40} height={40}
            style={{ width: 40, height: 40, objectFit: "contain" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0A1628" }}>KRMU ERP</div>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 400 }}>
          {step === "role" ? (
            <div className="fade-up">
              <div style={{ marginBottom: 32 }}>
                <div className="t-mono" style={{ marginBottom: 8 }}>Sign in as</div>
                <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0A1628", lineHeight: 1 }}>
                  Choose your role
                </h1>
                <p style={{ marginTop: 10, color: "#737373", fontSize: 14 }}>Select the role that matches your position at KRMU.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {ROLES.map(r => (
                  <button
                    key={r.role}
                    onClick={() => handleRoleSelect(r.role)}
                    style={{
                      padding: "14px 14px",
                      borderRadius: 12,
                      border: selected === r.role ? `2px solid ${r.color}` : "1.5px solid rgba(10,22,40,0.1)",
                      background: selected === r.role ? `${r.color}08` : "white",
                      textAlign: "left",
                      cursor: "none",
                      transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                    }}
                    className="cursor-hover"
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, marginBottom: 8 }} />
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1628", letterSpacing: "-0.01em" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="fade-up">
              <button
                onClick={() => setStep("role")}
                style={{ display: "flex", alignItems: "center", gap: 6, color: "#737373", fontSize: 13, marginBottom: 28, cursor: "none", background: "none", border: "none", padding: 0 }}
                className="cursor-hover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to role selection
              </button>

              <div style={{ marginBottom: 28 }}>
                <div className="t-mono" style={{ marginBottom: 8 }}>
                  {ROLES.find(r => r.role === selected)?.label}
                </div>
                <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0A1628", lineHeight: 1 }}>
                  Welcome back
                </h1>
                <p style={{ marginTop: 8, color: "#737373", fontSize: 14 }}>Sign in to your KRMU ERP account.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#525252", marginBottom: 6, letterSpacing: "0.02em" }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="field-input cursor-hover"
                    placeholder="your@krmu.edu.in"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#525252", marginBottom: 6, letterSpacing: "0.02em" }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="field-input cursor-hover"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="btn btn-primary btn-lg cursor-hover"
                  style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                      Signing in…
                    </>
                  ) : "Sign in to ERP"}
                </button>

                <div style={{ textAlign: "center", paddingTop: 8 }}>
                  <span style={{ fontSize: 12, color: "#737373" }}>Demo mode — pre-filled credentials</span>
                </div>
              </div>

              {/* Role cards quick select */}
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(10,22,40,0.08)" }}>
                <div style={{ fontSize: 11, color: "#737373", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Quick switch role</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ROLES.map(r => (
                    <button
                      key={r.role}
                      onClick={() => handleRoleSelect(r.role)}
                      className="cursor-hover"
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: selected === r.role ? `1.5px solid ${r.color}` : "1.5px solid rgba(10,22,40,0.1)",
                        background: selected === r.role ? `${r.color}10` : "transparent",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: selected === r.role ? r.color : "#525252",
                        cursor: "none",
                        transition: "all 0.2s",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center" }}>
          <p style={{ fontSize: 11.5, color: "#A0AEC0", letterSpacing: "0.02em" }}>
            © 2025 K.R. Mangalam University · Sohna Road, Gurugram · Built with ♥ for Education
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return <LoginInner />;
}
