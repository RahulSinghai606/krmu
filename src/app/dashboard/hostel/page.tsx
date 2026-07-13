"use client";
import { useState } from "react";
import { HOSTEL_ROOMS } from "@/lib/data";

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  available: { bg: "rgba(15,157,88,0.08)", border: "#0F9D58", text: "#0F7B45", label: "Available" },
  occupied: { bg: "rgba(21,101,192,0.07)", border: "#1565C0", text: "#1565C0", label: "Full" },
  maintenance: { bg: "rgba(245,166,35,0.1)", border: "#F5A623", text: "#b45309", label: "Maintenance" },
};

export default function HostelPage() {
  const [block, setBlock] = useState("all");
  const blocks = Array.from(new Set(HOSTEL_ROOMS.map(r => r.block)));
  const rooms = HOSTEL_ROOMS.filter(r => block === "all" || r.block === block);

  const totalCap = HOSTEL_ROOMS.reduce((s, r) => s + r.capacity, 0);
  const totalOcc = HOSTEL_ROOMS.reduce((s, r) => s + r.occupied, 0);
  const occRate = Math.round((totalOcc / totalCap) * 100);

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Hostel Management</span></div>
            <div className="page-hero-sub fade-up fade-up-1">{occRate}% occupancy · {totalCap - totalOcc} beds available across 4 blocks</div>
          </div>
          <button className="btn btn-gold btn-sm cursor-hover">Allocate Room</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Total Capacity", value: totalCap, color: "white" },
            { label: "Occupied", value: totalOcc, color: "#1565C0" },
            { label: "Available", value: totalCap - totalOcc, color: "#0F9D58" },
            { label: "Under Maintenance", value: HOSTEL_ROOMS.filter(r => r.status === "maintenance").length, color: "#F5A623" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          <button onClick={() => setBlock("all")} className="cursor-hover" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "none", background: block === "all" ? "#0A1628" : "#F7F7F5", color: block === "all" ? "white" : "#525252" }}>All Blocks</button>
          {blocks.map(b => (
            <button key={b} onClick={() => setBlock(b)} className="cursor-hover" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "none", background: block === b ? "#0A1628" : "#F7F7F5", color: block === b ? "white" : "#525252" }}>{b}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {rooms.map(r => {
            const st = STATUS_STYLE[r.status];
            return (
              <div key={r.id} className="card cursor-hover" style={{ padding: 16, borderTop: `3px solid ${st.border}`, background: st.bg }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.03em" }}>{r.roomNo}</div>
                    <div style={{ fontSize: 11, color: "#737373" }}>Floor {r.floor} · {r.type}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: st.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>{st.label}</span>
                </div>
                <div style={{ display: "flex", gap: 4, margin: "14px 0" }}>
                  {Array.from({ length: r.capacity }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < r.occupied ? st.border : "rgba(10,22,40,0.1)" }} />
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: "#525252", fontWeight: 600, marginBottom: 8 }}>{r.occupied}/{r.capacity} beds · {r.block}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {r.amenities.slice(0, 4).map(a => (
                    <span key={a} style={{ fontSize: 9.5, padding: "2px 7px", background: "white", borderRadius: 5, color: "#737373", border: "1px solid rgba(10,22,40,0.07)" }}>{a}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
