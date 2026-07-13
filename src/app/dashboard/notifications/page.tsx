"use client";
import { useState } from "react";
import { NOTIFICATIONS } from "@/lib/data";

const TYPE_STYLE: Record<string, { chip: string; bar: string }> = {
  info: { chip: "chip-blue", bar: "#1565C0" },
  warning: { chip: "chip-amber", bar: "#F5A623" },
  urgent: { chip: "chip-red", bar: "#C8102E" },
  success: { chip: "chip-green", bar: "#0F9D58" },
};

const CHANNEL_ICON: Record<string, string> = { email: "✉", sms: "✆", app: "▣", whatsapp: "✓" };

export default function NotificationsPage() {
  const [compose, setCompose] = useState(false);
  const [target, setTarget] = useState("students");
  const [channels, setChannels] = useState<string[]>(["email", "app"]);
  const [type, setType] = useState("info");

  const toggleChannel = (c: string) => setChannels(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Notifications</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Multi-channel broadcast · Email · SMS · App · WhatsApp</div>
          </div>
          <button onClick={() => setCompose(!compose)} className="btn btn-gold btn-sm cursor-hover">{compose ? "Cancel" : "+ New Broadcast"}</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {compose && (
          <div className="card card-p" style={{ marginBottom: 20, borderTop: "3px solid #F5A623" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0A1628", marginBottom: 16 }}>Compose Broadcast</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label className="field-label">Audience</label>
                <select value={target} onChange={e => setTarget(e.target.value)} className="field-input cursor-hover" style={{ height: 38 }}>
                  <option value="students">All Students (3,200)</option>
                  <option value="faculty">All Faculty (156)</option>
                  <option value="all">Everyone (4,500)</option>
                </select>
              </div>
              <div>
                <label className="field-label">Priority</label>
                <select value={type} onChange={e => setType(e.target.value)} className="field-input cursor-hover" style={{ height: 38 }}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Title</label>
              <input placeholder="Notification title…" className="field-input cursor-hover" style={{ height: 38 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Message</label>
              <textarea placeholder="Write your message…" rows={3} className="field-input cursor-hover" style={{ resize: "vertical", paddingTop: 10 }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Channels</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["email", "sms", "app", "whatsapp"].map(c => (
                  <button key={c} onClick={() => toggleChannel(c)} className="cursor-hover"
                    style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "none", textTransform: "capitalize",
                      border: channels.includes(c) ? "1.5px solid #0A1628" : "1.5px solid rgba(10,22,40,0.12)",
                      background: channels.includes(c) ? "#0A1628" : "white", color: channels.includes(c) ? "white" : "#525252" }}>
                    {CHANNEL_ICON[c]} {c}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary cursor-hover">Send Broadcast</button>
              <button className="btn btn-ghost cursor-hover">Save Draft</button>
              <span style={{ marginLeft: "auto", alignSelf: "center", fontSize: 12, color: "#A0AEC0" }}>AI can draft this — ask the assistant ↗</span>
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Recent Broadcasts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {NOTIFICATIONS.map(n => {
            const st = TYPE_STYLE[n.type];
            const readPct = Math.round((n.readCount / n.totalRecipients) * 100);
            return (
              <div key={n.id} className="card cursor-hover" style={{ padding: "16px 18px", borderLeft: `3px solid ${st.bar}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em", flex: 1, lineHeight: 1.3 }}>{n.title}</div>
                  <span className={`chip ${st.chip}`} style={{ marginLeft: 12 }}>{n.type}</span>
                </div>
                <p style={{ fontSize: 12.5, color: "#525252", lineHeight: 1.5, marginBottom: 12 }}>{n.message}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "#737373", fontWeight: 600 }}>By {n.sentBy}</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    {n.channels.map(c => (
                      <span key={c} style={{ fontSize: 10, padding: "2px 8px", background: "#F7F7F5", borderRadius: 5, color: "#525252", fontWeight: 600 }}>{CHANNEL_ICON[c]} {c}</span>
                    ))}
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 100, height: 5, background: "#EEF0F3", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${readPct}%`, background: "#0F9D58", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0A1628" }}>{readPct}% read</span>
                    <span style={{ fontSize: 10.5, color: "#A0AEC0" }}>{n.readCount.toLocaleString("en-IN")}/{n.totalRecipients.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
