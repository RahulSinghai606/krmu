"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { canAccess, moduleFromPath } from "@/lib/access";

interface Cmd { label: string; group: string; href?: string; action?: () => void; hint?: string }

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { toggleAIPanel, logout, user } = useApp();

  const onDashboard = pathname?.startsWith("/dashboard");

  const cmds: Cmd[] = useMemo(() => [
    { label: "Dashboard", group: "Navigate", href: "/dashboard" },
    { label: "Students", group: "Navigate", href: "/dashboard/students" },
    { label: "Fee Management", group: "Navigate", href: "/dashboard/fees" },
    { label: "Attendance", group: "Navigate", href: "/dashboard/attendance" },
    { label: "Examinations", group: "Navigate", href: "/dashboard/examinations" },
    { label: "Registration", group: "Navigate", href: "/dashboard/registration" },
    { label: "Curriculum", group: "Navigate", href: "/dashboard/curriculum" },
    { label: "Timetable", group: "Navigate", href: "/dashboard/timetable" },
    { label: "HR & Faculty", group: "Navigate", href: "/dashboard/hr" },
    { label: "Hostel", group: "Navigate", href: "/dashboard/hostel" },
    { label: "Transport", group: "Navigate", href: "/dashboard/transport" },
    { label: "Grievance", group: "Navigate", href: "/dashboard/grievance" },
    { label: "Certificates", group: "Navigate", href: "/dashboard/certificates" },
    { label: "Accreditation", group: "Navigate", href: "/dashboard/accreditation" },
    { label: "MIS Dashboards", group: "Navigate", href: "/dashboard/mis" },
    { label: "Notifications", group: "Navigate", href: "/dashboard/notifications" },
    { label: "Access Control", group: "Navigate", href: "/dashboard/access" },
    { label: "Ask KRMU AI", group: "Actions", action: () => toggleAIPanel(), hint: "AI" },
    { label: "AI Assistant (full page)", group: "Actions", href: "/dashboard/ai" },
    { label: "Sign out", group: "Actions", action: () => { logout(); router.push("/login"); } },
  ], [router, toggleAIPanel, logout]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return cmds.filter(c => {
      if (c.href?.startsWith("/dashboard") && !canAccess(user?.role, moduleFromPath(c.href))) return false;
      return !s || c.label.toLowerCase().includes(s);
    });
  }, [q, cmds, user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQ(""); setIdx(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setIdx(0), [q]);

  if (!onDashboard) return null;

  const run = (c: Cmd) => {
    setOpen(false);
    if (c.href) router.push(c.href);
    else c.action?.();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filtered[idx]) { e.preventDefault(); run(filtered[idx]); }
  };

  if (!open) return null;

  let lastGroup = "";

  return (
    <div onClick={() => setOpen(false)} className="overlay-fade" style={{ position: "fixed", inset: 0, zIndex: 95000, background: "rgba(10,22,40,0.35)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}>
      <div onClick={e => e.stopPropagation()} className="modal-in" style={{ width: "100%", maxWidth: 560, background: "white", borderRadius: 14, boxShadow: "0 24px 80px rgba(10,22,40,0.3)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid rgba(10,22,40,0.07)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={onListKey}
            placeholder="Search modules, actions…" style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#0A1628", background: "transparent", letterSpacing: "-0.01em" }} />
          <span style={{ fontSize: 10.5, color: "#A0AEC0", fontFamily: "monospace", border: "1px solid rgba(10,22,40,0.1)", borderRadius: 5, padding: "2px 6px" }}>ESC</span>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 8 }}>
          {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "#A0AEC0", fontSize: 13 }}>No results</div>}
          {filtered.map((c, i) => {
            const showGroup = c.group !== lastGroup;
            lastGroup = c.group;
            return (
              <div key={c.label}>
                {showGroup && <div style={{ fontSize: 10, fontWeight: 700, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 10px 4px" }}>{c.group}</div>}
                <button onMouseEnter={() => setIdx(i)} onClick={() => run(c)}
                  style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: idx === i ? "#0A1628" : "transparent", color: idx === i ? "white" : "#0A1628", fontSize: 13.5, fontWeight: 500 }}>
                  {c.label}
                  {c.hint && <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.6 }}>{c.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
