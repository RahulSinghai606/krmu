"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info" | "warning";
interface Toast { id: number; kind: ToastKind; title: string; desc?: string }

interface ToastCtx {
  toast: (t: { kind?: ToastKind; title: string; desc?: string }) => void;
  success: (title: string, desc?: string) => void;
  error: (title: string, desc?: string) => void;
  info: (title: string, desc?: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

let _id = 0;

const STYLE: Record<ToastKind, { bar: string; icon: ReactNode }> = {
  success: { bar: "#0F9D58", icon: <polyline points="20 6 9 17 4 12" /> },
  error: { bar: "#C8102E", icon: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> },
  warning: { bar: "#F5A623", icon: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></> },
  info: { bar: "#1565C0", icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);

  const toast = useCallback((t: { kind?: ToastKind; title: string; desc?: string }) => {
    const id = ++_id;
    const item: Toast = { id, kind: t.kind || "info", title: t.title, desc: t.desc };
    setToasts(prev => [...prev, item]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  const api: ToastCtx = {
    toast,
    success: (title, desc) => toast({ kind: "success", title, desc }),
    error: (title, desc) => toast({ kind: "error", title, desc }),
    info: (title, desc) => toast({ kind: "info", title, desc }),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100000, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {toasts.map(t => {
          const s = STYLE[t.kind];
          return (
            <div key={t.id} className="toast-in" style={{
              pointerEvents: "auto", minWidth: 300, maxWidth: 380,
              background: "white", borderRadius: 12, padding: "13px 15px",
              boxShadow: "0 12px 40px rgba(10,22,40,0.18)", border: "1px solid rgba(10,22,40,0.06)",
              borderLeft: `3px solid ${s.bar}`, display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: `${s.bar}15`, color: s.bar, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", letterSpacing: "-0.01em" }}>{t.title}</div>
                {t.desc && <div style={{ fontSize: 12, color: "#737373", marginTop: 2, lineHeight: 1.4 }}>{t.desc}</div>}
              </div>
              <button onClick={() => remove(t.id)} className="cursor-hover" style={{ background: "none", border: "none", color: "#C4C9D4", fontSize: 15, lineHeight: 1, cursor: "pointer", flexShrink: 0 }}>×</button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
