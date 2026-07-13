"use client";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  variant?: "modal" | "drawer";
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = 480, variant = "modal" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isDrawer = variant === "drawer";

  return (
    <div onClick={onClose} className="overlay-fade" style={{
      position: "fixed", inset: 0, zIndex: 90000, background: "rgba(10,22,40,0.4)",
      backdropFilter: "blur(3px)", display: "flex",
      alignItems: isDrawer ? "stretch" : "center",
      justifyContent: isDrawer ? "flex-end" : "center",
      padding: isDrawer ? 0 : 24,
    }}>
      <div onClick={e => e.stopPropagation()} className={isDrawer ? "drawer-in" : "modal-in"} style={{
        background: "white", width: isDrawer ? width : "100%", maxWidth: width,
        maxHeight: isDrawer ? "100%" : "90vh", height: isDrawer ? "100%" : "auto",
        borderRadius: isDrawer ? 0 : 16, display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(10,22,40,0.3)", overflow: "hidden",
      }}>
        {(title || subtitle) && (
          <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(10,22,40,0.07)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              {title && <div style={{ fontSize: 16, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{title}</div>}
              {subtitle && <div style={{ fontSize: 12.5, color: "#737373", marginTop: 3 }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} className="cursor-hover" style={{ background: "#F7F7F5", border: "none", width: 28, height: 28, borderRadius: 8, color: "#737373", fontSize: 16, lineHeight: 1, cursor: "pointer", flexShrink: 0 }}>×</button>
          </div>
        )}
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(10,22,40,0.07)", display: "flex", justifyContent: "flex-end", gap: 10, background: "#FAFAF8" }}>{footer}</div>}
      </div>
    </div>
  );
}
