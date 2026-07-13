"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Phone, Sparkles, TrendingDown, Users } from "lucide-react";

interface Call { id: string; name: string; programme: string; source: string; stage: string; phone: string; propensity: number; reasons: string[]; lastContacted: number | null; }
interface Prog { programme: string; enrolled: number; atRisk: number; avgAttendance: number; passRate: number | null; withDues: number; healthScore: number; concerns: string[]; }

export default function SuccessPage() {
  const { user, toggleAIPanel, aiPanelOpen, sendAIMessage } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<"funnel" | "cockpit">("funnel");
  const [funnel, setFunnel] = useState<{ total: number; byStage: Record<string, number>; conversionPct: number } | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [progs, setProgs] = useState<Prog[]>([]);
  const [draftFor, setDraftFor] = useState<Call | null>(null);
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    fetch("/api/success?view=funnel").then(r => r.json()).then(setFunnel).catch(() => {});
    fetch("/api/success?view=calls").then(r => r.json()).then(d => setCalls(d.calls || [])).catch(() => {});
    fetch("/api/success?view=cockpit").then(r => r.json()).then(d => setProgs(d.programmes || [])).catch(() => {});
  }, []);

  const openDraft = async (c: Call) => {
    setDraftFor(c); setDraft(""); setDrafting(true);
    const res = await fetch("/api/success", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", leadId: c.id, channel: "email" }) });
    const d = await res.json(); setDraft(d.draft || ""); setDrafting(false);
  };
  const send = async () => {
    if (!draftFor) return;
    await fetch("/api/success", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", leadId: draftFor.id, channel: "email" }) });
    toast.success("Follow-up sent", `${draftFor.name} marked contacted`);
    setDraftFor(null);
    fetch("/api/success?view=calls").then(r => r.json()).then(d => setCalls(d.calls || []));
  };
  const askCockpit = () => { if (!aiPanelOpen) toggleAIPanel(); sendAIMessage("Which programmes are bleeding students and why?"); };

  const STAGES = ["enquiry", "application", "admitted", "lost"];
  const stageColor: Record<string, string> = { enquiry: "#1565C0", application: "#F5A623", admitted: "#0F9D58", lost: "#C8102E" };
  const propColor = (p: number) => p >= 70 ? "#0F9D58" : p >= 50 ? "#F5A623" : "#C8102E";

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="page-hero">
        <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Student Success Intelligence</span></div>
        <div className="page-hero-sub fade-up fade-up-1">Enrolment-to-employment · admission funnel · early-warning · leadership cockpit</div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", gap: 6, background: "#EEF3FB", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 20 }}>
          {([["funnel", "Admission Funnel"], ["cockpit", "Leadership Cockpit"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className="cursor-hover" style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12.5, fontWeight: 700, border: "none", background: tab === k ? "white" : "transparent", color: tab === k ? "#1565C0" : "#737373", boxShadow: tab === k ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>{label}</button>
          ))}
        </div>

        {tab === "funnel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {funnel && (
              <div className="card card-p">
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0A1628", marginBottom: 14 }}>Funnel · {funnel.total} leads · <span style={{ color: "#0F9D58" }}>{funnel.conversionPct}% converted</span></div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {STAGES.map(st => (
                    <div key={st} style={{ flex: 1, minWidth: 120, background: `${stageColor[st]}10`, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${stageColor[st]}` }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: stageColor[st] }}>{funnel.byStage[st] || 0}</div>
                      <div style={{ fontSize: 12, color: "#737373", textTransform: "capitalize" }}>{st}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "13px 18px", borderBottom: "1px solid rgba(10,22,40,0.06)", display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 800, color: "#0A1628" }}><Phone size={15} color="#1565C0" /> Who to call today</div>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl" style={{ minWidth: 720 }}>
                  <thead><tr><th>Lead</th><th>Programme</th><th>Source</th><th>Propensity</th><th>Last contact</th><th>Why</th><th></th></tr></thead>
                  <tbody>
                    {calls.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700 }}>{c.name}</td>
                        <td>{c.programme}</td>
                        <td style={{ textTransform: "capitalize" }}>{c.source}</td>
                        <td><span className="chip" style={{ background: `${propColor(c.propensity)}15`, color: propColor(c.propensity), fontWeight: 700 }}>{c.propensity}%</span></td>
                        <td style={{ fontSize: 12, color: c.lastContacted === null ? "#C8102E" : "#737373" }}>{c.lastContacted === null ? "never" : `${c.lastContacted}d ago`}</td>
                        <td style={{ fontSize: 11.5, color: "#525252", maxWidth: 240 }}>{c.reasons.join(", ")}</td>
                        <td><button onClick={() => openDraft(c)} className="btn btn-primary btn-sm cursor-hover" style={{ display: "inline-flex", gap: 5, alignItems: "center", whiteSpace: "nowrap" }}><Sparkles size={13} /> Draft</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "cockpit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card card-p" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>Programme health — ranked by risk</div>
                <div style={{ fontSize: 12, color: "#A0AEC0" }}>Live fusion of enrolment, attendance, results & fees</div>
              </div>
              <button onClick={askCockpit} className="btn btn-gold btn-sm cursor-hover" style={{ display: "flex", gap: 6, alignItems: "center" }}><Sparkles size={14} /> Ask: which are bleeding students?</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {progs.map(p => {
                const c = p.healthScore >= 70 ? "#0F9D58" : p.healthScore >= 50 ? "#F5A623" : "#C8102E";
                return (
                  <div key={p.programme} className="card card-p">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0A1628" }}>{p.programme}</div>
                      <span className="chip" style={{ background: `${c}15`, color: c, fontWeight: 800 }}>{p.healthScore}</span>
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
                      <Stat icon={<Users size={13} />} label="Enrolled" v={p.enrolled} />
                      <Stat icon={<TrendingDown size={13} />} label="At-risk" v={p.atRisk} c={p.atRisk ? "#C8102E" : "#0F9D58"} />
                      <Stat label="Avg att." v={`${p.avgAttendance}%`} c={p.avgAttendance < 75 ? "#C8102E" : "#0A1628"} />
                      <Stat label="Pass" v={p.passRate === null ? "—" : `${p.passRate}%`} />
                    </div>
                    {p.concerns.length > 0 && <div style={{ fontSize: 11.5, color: "#C8102E", marginTop: 10 }}>⚠ {p.concerns.join(" · ")}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal open={!!draftFor} onClose={() => setDraftFor(null)} title={`Follow-up · ${draftFor?.name}`} subtitle={draftFor ? `${draftFor.programme} · ${draftFor.source}` : ""}
        footer={<><button onClick={() => setDraftFor(null)} className="btn btn-ghost cursor-hover">Cancel</button><button onClick={send} disabled={drafting} className="btn btn-primary cursor-hover">Send follow-up</button></>}>
        {drafting ? <div style={{ color: "#A0AEC0", fontSize: 13, padding: 20 }}>Drafting personalized message…</div> :
          <textarea value={draft} onChange={e => setDraft(e.target.value)} className="field-input" style={{ minHeight: 160, fontSize: 13, padding: 12, lineHeight: 1.6, width: "100%" }} />}
      </Modal>
    </div>
  );
}

function Stat({ icon, label, v, c = "#0A1628" }: { icon?: React.ReactNode; label: string; v: string | number; c?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 3 }}>{icon}{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
    </div>
  );
}
