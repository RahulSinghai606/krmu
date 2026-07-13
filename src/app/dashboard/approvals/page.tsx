"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";

interface PA { id: string; createdAt: string; requestedBy: string; role: string; tool: string; params: string; summary: string; status: string; decidedBy?: string | null; decidedAt?: string | null; result?: string | null }

const TOOL_LABEL: Record<string, string> = {
  send_notice: "Send Notice", prepare_fee_reminders: "Fee Reminders", publish_pending_results: "Publish Results",
};

export default function ApprovalsPage() {
  const { user } = useApp();
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<PA[]>([]);
  const [filter, setFilter] = useState<"pending"|"all">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => fetch("/api/ai/pending").then(r => r.json()).then(d => setRows(d.actions || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const list = rows.filter(r => filter === "all" || r.status === "pending");
  const pendingCount = rows.filter(r => r.status === "pending").length;

  const decide = async (pa: PA, action: "approve" | "reject") => {
    if (action === "reject") {
      const ok = await confirm({ title: "Reject this action?", message: pa.summary, confirmLabel: "Reject", danger: true });
      if (!ok) return;
    }
    setBusy(pa.id);
    try {
      const res = await fetch(`/api/ai/pending/${pa.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, by: user?.email, _role: user?.role }),
      });
      const data = await res.json();
      if (res.ok) { await load(); toast.success(action === "approve" ? "Approved & executed" : "Rejected", data.result || pa.summary); }
      else toast.error("Failed", data.error);
    } catch { toast.error("Failed", "Network error"); }
    finally { setBusy(null); }
  };

  const parsedParams = (p: string) => { try { return JSON.parse(p); } catch { return {}; } };

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">AI Approvals</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Human-in-the-loop · AI-prepared actions await your review before they take effect</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["pending", "all"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className="cursor-hover"
                style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: "none", textTransform: "capitalize",
                  background: filter === f ? "white" : "rgba(255,255,255,0.1)", color: filter === f ? "#0A1628" : "rgba(255,255,255,0.6)" }}>
                {f}{f === "pending" ? ` (${pendingCount})` : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {list.length === 0 ? (
          <div className="card card-p" style={{ textAlign: "center", padding: 48, color: "#A0AEC0" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", marginBottom: 6 }}>Nothing awaiting approval</div>
            When the AI prepares a notice, reminder, or publish action, it appears here for review.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map(pa => {
              const args = parsedParams(pa.params);
              return (
                <div key={pa.id} className="card" style={{ padding: "16px 20px", borderLeft: `3px solid ${pa.status === "pending" ? "#F5A623" : pa.status === "approved" ? "#0F9D58" : "#C8102E"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#1565C0", background: "rgba(21,101,192,0.1)", padding: "2px 8px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{TOOL_LABEL[pa.tool] || pa.tool}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#F5A623", background: "rgba(245,166,35,0.12)", padding: "2px 8px", borderRadius: 5 }}>⚡ AI-prepared</span>
                        <span className={`chip ${pa.status === "pending" ? "chip-amber" : pa.status === "approved" ? "chip-green" : "chip-red"}`}>{pa.status}</span>
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{pa.summary}</div>
                      {(args.title || args.message) && (
                        <div style={{ marginTop: 8, padding: "10px 12px", background: "#F7F7F5", borderRadius: 8 }}>
                          {args.title && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628" }}>{args.title}</div>}
                          {args.message && <div style={{ fontSize: 12, color: "#525252", marginTop: 3, lineHeight: 1.5 }}>{args.message}</div>}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 8 }}>
                        Requested by {pa.requestedBy} ({pa.role}) · {new Date(pa.createdAt).toLocaleString("en-IN")}
                        {pa.result && pa.status !== "pending" && <span style={{ color: pa.status === "approved" ? "#0F9D58" : "#C8102E" }}> · {pa.result}</span>}
                      </div>
                    </div>
                    {pa.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => decide(pa, "reject")} disabled={busy === pa.id} className="btn btn-ghost btn-sm cursor-hover">Reject</button>
                        <button onClick={() => decide(pa, "approve")} disabled={busy === pa.id} className="btn btn-primary btn-sm cursor-hover">{busy === pa.id ? "…" : "Approve & Release"}</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
