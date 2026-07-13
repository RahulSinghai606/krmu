"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

// §5.2 — One design system. Documented tokens + component library, owned by KRMU.
const COLORS = [
  ["Navy / Ink", "#0A1628", "--color-navy", "Primary text, headers, sidebar"],
  ["Blue", "#1565C0", "--color-blue", "Primary actions, links, info"],
  ["Red", "#C8102E", "--color-red", "Destructive, overdue, errors"],
  ["Gold", "#F5A623", "--color-gold", "Accent, highlights, brand"],
  ["Success", "#0F9D58", "--color-success", "Paid, present, healthy"],
  ["Mist", "#F7F7F5", "--color-mist", "Surfaces, app background"],
  ["Stone", "#525252", "--color-stone", "Secondary text"],
  ["Pebble", "#737373", "--color-pebble", "Tertiary / metadata"],
];
const TYPE = [
  ["Display", "t-display", "clamp 4–10rem / 800 / -0.05em"],
  ["Hero", "t-hero", "clamp 2.8–7rem / 800"],
  ["Title", "t-title", "clamp 1.8–3.5rem / 700"],
  ["Headline", "t-headline", "clamp 1.2–1.75rem / 700"],
  ["Mono / label", "t-mono", "11px / uppercase / 0.12em"],
];
const SPACE = [4, 8, 12, 16, 20, 24, 32, 48];

export default function DesignSystemPage() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const copy = (t: string) => { navigator.clipboard?.writeText(t); toast.success("Copied", t); };

  const Section = ({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) => (
    <div className="card card-p" style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{title}</div>
      {note && <div style={{ fontSize: 12, color: "#A0AEC0", marginTop: 3, marginBottom: 14 }}>{note}</div>}
      <div style={{ marginTop: note ? 0 : 14 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Design System</span></div>
        <div className="page-hero-sub fade-up fade-up-1">One coherent system across every portal & the mobile app · tokens, components, usage · owned by KRMU (§5.2)</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <Section title="Colour tokens" note="Dominant navy + sharp accents. Use tokens, never raw hex, so a future partner can re-theme without breaking screens.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {COLORS.map(([name, hex, token, use]) => (
              <button key={token} onClick={() => copy(token)} className="cursor-hover" style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, border: "1px solid rgba(10,22,40,0.07)", borderRadius: 10, background: "white", textAlign: "left" }}>
                <span style={{ width: 40, height: 40, borderRadius: 8, background: hex, flexShrink: 0, border: "1px solid rgba(0,0,0,0.06)" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628" }}>{name}</div>
                  <div style={{ fontSize: 10.5, color: "#A0AEC0", fontFamily: "monospace" }}>{token}</div>
                  <div style={{ fontSize: 10.5, color: "#737373", marginTop: 2 }}>{use}</div>
                </div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Typographic scale" note="One scale, weight-800 display, tight tracking. Class names map to CSS utilities.">
          {TYPE.map(([name, cls, spec]) => (
            <div key={cls} style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "8px 0", borderBottom: "1px solid rgba(10,22,40,0.05)" }}>
              <span className={cls} style={{ fontSize: name === "Display" || name === "Hero" ? 28 : undefined, color: "#0A1628", flex: 1 }}>{name}</span>
              <span style={{ fontSize: 11, color: "#A0AEC0", fontFamily: "monospace" }}>.{cls}</span>
              <span style={{ fontSize: 11, color: "#737373", width: 240, textAlign: "right" }}>{spec}</span>
            </div>
          ))}
        </Section>

        <Section title="Spacing scale" note="4px base unit. Generous spacing is a requirement, not decoration.">
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            {SPACE.map(s => (
              <div key={s} style={{ textAlign: "center" }}>
                <div style={{ width: s, height: s, background: "#1565C0", borderRadius: 3, margin: "0 auto" }} />
                <div style={{ fontSize: 10.5, color: "#737373", marginTop: 6 }}>{s}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Components" note="One library, reused everywhere. Learned once, behaves the same in every module.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <button className="btn btn-primary cursor-hover">Primary</button>
            <button className="btn btn-blue cursor-hover">Blue</button>
            <button className="btn btn-gold cursor-hover">Gold</button>
            <button className="btn btn-red cursor-hover">Danger</button>
            <button className="btn btn-ghost cursor-hover">Ghost</button>
            <button className="btn btn-primary btn-sm cursor-hover">Small</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {["chip-green", "chip-blue", "chip-amber", "chip-red", "chip-gray", "chip-navy"].map(c => <span key={c} className={`chip ${c}`}>{c.replace("chip-", "")}</span>)}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input className="field-input" placeholder="Field input" style={{ width: 200, height: 38 }} />
            <button onClick={() => setModal(true)} className="btn btn-ghost cursor-hover">Open modal</button>
            <button onClick={() => toast.success("Toast example", "Branded, auto-dismiss")} className="btn btn-ghost cursor-hover">Fire toast</button>
            <span style={{ fontSize: 12, color: "#737373" }}>Also: Drawer, Confirm dialog, Skeleton, ⌘K palette, Tabs, Cards.</span>
          </div>
        </Section>

        <Section title="Interaction patterns" note="Consistent across modules.">
          <ul style={{ fontSize: 13, color: "#374151", lineHeight: 1.9, paddingLeft: 18 }}>
            <li>Primary action is always the filled navy/blue button, top-right or end of a form.</li>
            <li>Destructive actions confirm via the shared dialog before proceeding.</li>
            <li>Writes give immediate feedback via toast; lists show skeletons while loading.</li>
            <li>Every screen is role-adaptive — users never see actions outside their role.</li>
            <li>⌘K opens the command palette for fast navigation from anywhere.</li>
            <li>Keyboard focus is always visible; motion respects reduced-motion settings.</li>
          </ul>
        </Section>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Modal component" subtitle="Shared across every module"
        footer={<><button onClick={() => setModal(false)} className="btn btn-ghost cursor-hover">Cancel</button><button onClick={() => setModal(false)} className="btn btn-primary cursor-hover">Confirm</button></>}>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>One modal component — used for forms, confirmations and detail views. Escape to close, focus-trapped, animated. Drawers are the same component with <code>variant=&quot;drawer&quot;</code>.</p>
      </Modal>
    </div>
  );
}
