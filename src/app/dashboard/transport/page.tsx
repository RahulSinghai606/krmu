"use client";
import { TRANSPORT_ROUTES } from "@/lib/data";

export default function TransportPage() {
  const totalStudents = TRANSPORT_ROUTES.reduce((s, r) => s + r.students, 0);
  const totalCapacity = TRANSPORT_ROUTES.reduce((s, r) => s + r.capacity, 0);
  const activeRoutes = TRANSPORT_ROUTES.filter(r => r.status === "active").length;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Transport Management</span></div>
            <div className="page-hero-sub fade-up fade-up-1">{activeRoutes} active routes · {totalStudents} students enrolled · GPS-tracked fleet</div>
          </div>
          <button className="btn btn-gold btn-sm cursor-hover">+ Add Route</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Active Routes", value: activeRoutes, color: "white" },
            { label: "Students Enrolled", value: totalStudents, color: "#1565C0" },
            { label: "Fleet Utilization", value: Math.round((totalStudents / totalCapacity) * 100) + "%", color: "#0F9D58" },
            { label: "In Maintenance", value: TRANSPORT_ROUTES.filter(r => r.status === "maintenance").length, color: "#F5A623" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {TRANSPORT_ROUTES.map(r => {
          const util = Math.round((r.students / r.capacity) * 100);
          return (
            <div key={r.id} className="card cursor-hover" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, flexShrink: 0, background: r.status === "active" ? "linear-gradient(135deg, #1f6fd6, #1250a6)" : "#A0AEC0", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 600 }}>ROUTE</span>
                  <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em" }}>{r.routeNo}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{r.origin}</span>
                    <span className={`chip ${r.status === "active" ? "chip-green" : "chip-amber"}`} style={{ fontSize: 9.5 }}>{r.status}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {r.via.map((v, i) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11.5, color: "#525252" }}>{v}</span>
                        {i < r.via.length - 1 && <span style={{ color: "#C8102E", fontSize: 11 }}>→</span>}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 6 }}>Driver: {r.driver} · Vehicle: {r.vehicle}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.04em" }}>{r.students}<span style={{ fontSize: 13, color: "#A0AEC0", fontWeight: 600 }}>/{r.capacity}</span></div>
                  <div style={{ width: 120, height: 6, background: "#EEF0F3", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
                    <div style={{ height: "100%", width: `${util}%`, background: util > 90 ? "#C8102E" : util > 70 ? "#F5A623" : "#0F9D58", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: "#737373", marginTop: 4 }}>{util}% utilized</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
