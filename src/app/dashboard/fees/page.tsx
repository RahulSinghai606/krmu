"use client";
import { useState, useEffect } from "react";
import { FEE_RECORDS } from "@/lib/data";
import type { FeeRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useApp } from "@/lib/store";
import { StudentSelfView } from "@/components/student/StudentSelfView";
import { printFeeReceipt } from "@/lib/pdf";

export default function FeesPage() {
  const [tab, setTab] = useState<"collections"|"defaulters"|"structure">("collections");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [records, setRecords] = useState<FeeRecord[]>(FEE_RECORDS);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useApp();

  // Payment modal state
  const [payFee, setPayFee] = useState<FeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("Online");
  const [saving, setSaving] = useState(false);

  const loadFees = () =>
    fetch("/api/fees")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.fees)) { setRecords(d.fees); setLive(true); } })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { loadFees(); }, []);

  if (user?.role === "student") return <StudentSelfView view="fees" />;

  const openPay = (f: FeeRecord) => { setPayFee(f); setPayAmount(String(f.due)); setPayMode("Online"); };

  const submitPayment = async () => {
    if (!payFee) return;
    const amount = parseInt(payAmount.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (amount > payFee.due) { toast.error("Amount exceeds outstanding due", `Maximum ₹${payFee.due.toLocaleString("en-IN")}`); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/fees", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: payFee.id, amount, mode: payMode }),
      });
      const data = await res.json();
      if (res.ok && data.fee) {
        await loadFees();
        toast.success("Payment recorded", `₹${amount.toLocaleString("en-IN")} · ${payFee.studentName} · Receipt ${data.fee.receiptNo}`);
        setPayFee(null);
      } else {
        toast.error("Payment failed", data.error || "Is the database running?");
      }
    } catch {
      toast.error("Payment failed", "Network or server error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter(f => {
    const q = search.toLowerCase();
    const matchQ = !q || f.studentName.toLowerCase().includes(q) || f.studentId.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || f.status === statusFilter;
    return matchQ && matchS;
  });

  const totalCollected = records.reduce((s, f) => s + f.paid, 0);
  const totalDue = records.reduce((s, f) => s + f.due, 0);
  const overdueCount = records.filter(f => f.status === "overdue").length;
  const paidCount = records.filter(f => f.status === "paid").length;

  const statusChip = (status: string) => {
    const map = { paid: "chip-green", partial: "chip-amber", overdue: "chip-red", pending: "chip-gray" };
    return (map as any)[status] || "chip-gray";
  };

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Hero */}
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Fee Management</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Even Semester 2024–25 · Fee Cycle Active · {live ? "● Live database" : "○ Demo data"}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-gold btn-sm cursor-hover">Record Payment</button>
            <button className="btn btn-sm cursor-hover" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>Export Report</button>
          </div>
        </div>

        {/* Hero stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Collected", value: `₹${(totalCollected/100000).toFixed(2)} L`, color: "#0F9D58" },
            { label: "Outstanding Dues", value: `₹${(totalDue/100000).toFixed(2)} L`, color: "#C8102E" },
            { label: "Paid in Full", value: paidCount, color: "white" },
            { label: "Overdue Cases", value: overdueCount, color: "#F5A623" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "1px solid rgba(10,22,40,0.07)", padding: "0 24px", display: "flex", gap: 28, flexShrink: 0 }}>
        {(["collections","defaulters","structure"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="cursor-hover"
            style={{ padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none",
              color: tab === t ? "#0A1628" : "#737373",
              borderBottom: tab === t ? "2px solid #0A1628" : "2px solid transparent",
              letterSpacing: "-0.01em", textTransform: "capitalize", transition: "all 0.2s" }}>
            {t === "collections" ? "All Collections" : t === "defaulters" ? "Defaulters / Overdue" : "Fee Structure"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {(tab === "collections" || tab === "defaulters") && (
          <div style={{ padding: "20px 24px" }}>
            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A0AEC0" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student name or ID…" className="field-input cursor-hover" style={{ paddingLeft: 32, height: 36, fontSize: 13 }} />
              </div>
              {tab === "collections" && (
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="field-input cursor-hover" style={{ width: 150, height: 36, fontSize: 13 }}>
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                  <option value="pending">Pending</option>
                </select>
              )}
              <button className="btn btn-ghost btn-sm cursor-hover">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
              <button className="btn btn-primary btn-sm cursor-hover">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Send Reminders
              </button>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              {loading ? <SkeletonRows rows={8} cols={10} /> : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Programme</th>
                    <th>Sem</th>
                    <th>Fee Head</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(tab === "defaulters" ? filtered.filter(f => f.status === "overdue" || f.status === "partial") : filtered).map(f => (
                    <tr key={f.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{f.studentName}</div>
                        <div style={{ fontSize: 10.5, color: "#A0AEC0", fontFamily: "monospace" }}>{f.studentId}</div>
                      </td>
                      <td style={{ fontSize: 12.5 }}>{f.programme}</td>
                      <td style={{ fontWeight: 700 }}>Sem {f.semester}</td>
                      <td style={{ fontSize: 12.5 }}>{f.feeHead}</td>
                      <td style={{ fontWeight: 700 }}>₹{f.amount.toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: 700, color: "#0F9D58" }}>₹{f.paid.toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: 800, color: f.due > 0 ? "#C8102E" : "#0F9D58" }}>
                        {f.due > 0 ? `₹${f.due.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "#737373" }}>{formatDate(f.dueDate)}</td>
                      <td><span className={`chip ${statusChip(f.status)}`}>{f.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 5 }}>
                          {f.due > 0 && (
                            <button onClick={() => openPay(f)} className="btn btn-sm btn-blue cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Pay</button>
                          )}
                          {f.receiptNo && (
                            <button onClick={() => printFeeReceipt(f)} title="Download receipt PDF" className="btn btn-sm btn-ghost cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        )}

        {tab === "structure" && (
          <div style={{ padding: "24px 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { programme: "B.Tech CSE / AI & ML", fees: [
                  { head: "Tuition Fee", amount: "₹95,000" },
                  { head: "Development Fee", amount: "₹12,000" },
                  { head: "Exam Fee", amount: "₹3,500" },
                  { head: "Library Fee", amount: "₹2,000" },
                  { head: "Sports Fee", amount: "₹1,500" },
                  { head: "Total (Per Semester)", amount: "₹1,14,000", bold: true },
                ]},
                { programme: "MBA / M.Tech", fees: [
                  { head: "Tuition Fee", amount: "₹1,40,000" },
                  { head: "Development Fee", amount: "₹15,000" },
                  { head: "Exam Fee", amount: "₹4,000" },
                  { head: "Library Fee", amount: "₹2,500" },
                  { head: "Activity Fee", amount: "₹3,000" },
                  { head: "Total (Per Semester)", amount: "₹1,64,500", bold: true },
                ]},
                { programme: "BA LLB / LLB", fees: [
                  { head: "Tuition Fee", amount: "₹80,000" },
                  { head: "Development Fee", amount: "₹10,000" },
                  { head: "Exam Fee", amount: "₹3,000" },
                  { head: "Library Fee", amount: "₹2,000" },
                  { head: "Total (Per Semester)", amount: "₹95,000", bold: true },
                ]},
                { programme: "BBA / B.Com (Hons.)", fees: [
                  { head: "Tuition Fee", amount: "₹65,000" },
                  { head: "Development Fee", amount: "₹8,000" },
                  { head: "Exam Fee", amount: "₹2,500" },
                  { head: "Library Fee", amount: "₹1,500" },
                  { head: "Total (Per Semester)", amount: "₹77,000", bold: true },
                ]},
              ].map(p => (
                <div key={p.programme} className="card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", background: "#1565C0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{p.programme}</div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Academic Year 2024–25</div>
                  </div>
                  <div>
                    {p.fees.map((f, i) => (
                      <div key={f.head} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 20px",
                        borderBottom: i < p.fees.length - 1 ? "1px solid rgba(10,22,40,0.05)" : "none",
                        background: f.bold ? "rgba(21,101,192,0.04)" : "transparent",
                      }}>
                        <span style={{ fontSize: 13, color: f.bold ? "#0A1628" : "#525252", fontWeight: f.bold ? 800 : 500 }}>{f.head}</span>
                        <span style={{ fontSize: 13, fontWeight: f.bold ? 800 : 600, color: f.bold ? "#1565C0" : "#0A1628" }}>{f.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Scholarships */}
            <div className="card" style={{ marginTop: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(10,22,40,0.06)" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>Scholarships & Concessions</div>
              </div>
              <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { name: "KREE Scholarship", desc: "Up to 100% tuition waiver based on merit", students: 42 },
                  { name: "SC/ST Concession", desc: "50% concession on tuition fees", students: 128 },
                  { name: "Merit Scholarship", desc: "₹25,000 per semester for CGPA ≥ 9.0", students: 67 },
                  { name: "EWS Concession", desc: "30% concession on tuition fees", students: 89 },
                  { name: "Sibling Discount", desc: "10% concession for siblings enrolled", students: 34 },
                  { name: "Sports Scholarship", desc: "Up to ₹30,000 for national-level athletes", students: 18 },
                ].map(s => (
                  <div key={s.name} style={{ padding: "12px 14px", background: "#F7F7F5", borderRadius: 10 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628" }}>{s.name}</div>
                    <div style={{ fontSize: 11.5, color: "#737373", marginTop: 4, lineHeight: 1.45 }}>{s.desc}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1565C0", marginTop: 8 }}>{s.students} beneficiaries</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={!!payFee}
        onClose={() => !saving && setPayFee(null)}
        title="Record Payment"
        subtitle={payFee ? `${payFee.studentName} · ${payFee.programme} · ${payFee.feeHead}` : ""}
        width={440}
        footer={
          <>
            <button onClick={() => setPayFee(null)} disabled={saving} className="btn btn-ghost cursor-hover">Cancel</button>
            <button onClick={submitPayment} disabled={saving} className="btn btn-primary cursor-hover">
              {saving ? "Recording…" : "Record Payment"}
            </button>
          </>
        }
      >
        {payFee && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                ["Total", `₹${payFee.amount.toLocaleString("en-IN")}`, "#0A1628"],
                ["Paid", `₹${payFee.paid.toLocaleString("en-IN")}`, "#0F9D58"],
                ["Due", `₹${payFee.due.toLocaleString("en-IN")}`, "#C8102E"],
              ].map(([l, v, c]) => (
                <div key={l} style={{ padding: "10px 12px", background: "#F7F7F5", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: c as string, marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
            <div>
              <label className="field-label">Amount (₹)</label>
              <input value={payAmount} onChange={e => setPayAmount(e.target.value.replace(/\D/g, ""))} autoFocus
                onKeyDown={e => { if (e.key === "Enter") submitPayment(); }}
                className="field-input" style={{ height: 40, fontSize: 15, fontWeight: 700 }} placeholder="0" />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {[payFee.due, Math.round(payFee.due / 2)].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map(v => (
                  <button key={v} onClick={() => setPayAmount(String(v))} className="btn btn-ghost btn-sm cursor-hover" style={{ fontSize: 11 }}>₹{v.toLocaleString("en-IN")}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Payment Mode</label>
              <select value={payMode} onChange={e => setPayMode(e.target.value)} className="field-input" style={{ height: 40 }}>
                <option>Online</option><option>NEFT</option><option>UPI</option><option>DD</option><option>Cash</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
