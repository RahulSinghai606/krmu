// Dependency-free PDF generation via a styled print window → browser "Save as PDF".
// Produces a professional KRMU-branded document. Works fully offline (logo from /public).

interface FeeLike {
  studentName: string; programme: string; semester: number; feeHead: string;
  amount: number; paid: number; due: number; status: string;
  receiptNo?: string | null; paymentDate?: string | null; paymentMode?: string | null;
}

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const today = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

function shell(title: string, inner: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; }
    body { color:#0A1628; padding:48px 54px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .head { display:flex; align-items:center; gap:16px; border-bottom:3px solid #0A1628; padding-bottom:18px; }
    .head img { width:64px; height:64px; object-fit:contain; }
    .head h1 { font-size:22px; letter-spacing:-0.5px; color:#0A1628; }
    .head .sub { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#1565C0; font-weight:700; margin-top:2px; }
    .head .addr { font-size:11px; color:#737373; margin-top:3px; }
    .doctype { margin-left:auto; text-align:right; }
    .doctype .t { font-size:13px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#C8102E; }
    .doctype .d { font-size:11px; color:#737373; margin-top:3px; }
    .meta { display:flex; justify-content:space-between; margin:26px 0; gap:24px; }
    .meta .box { flex:1; }
    .meta .lbl { font-size:9px; text-transform:uppercase; letter-spacing:1px; color:#A0AEC0; font-weight:700; }
    .meta .val { font-size:13px; font-weight:600; margin-top:3px; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#A0AEC0; padding:10px 12px; border-bottom:2px solid #0A1628; }
    td { padding:12px; font-size:13px; border-bottom:1px solid #eee; }
    td.r, th.r { text-align:right; }
    .total { display:flex; justify-content:flex-end; margin-top:18px; }
    .total .card { width:280px; }
    .total .row { display:flex; justify-content:space-between; padding:7px 0; font-size:13px; }
    .total .grand { border-top:2px solid #0A1628; margin-top:6px; padding-top:10px; font-size:16px; font-weight:800; }
    .stamp { margin-top:32px; display:inline-block; padding:8px 16px; border:2px solid #0F9D58; color:#0F9D58; border-radius:8px; font-weight:800; font-size:14px; letter-spacing:1px; transform:rotate(-3deg); }
    .foot { margin-top:48px; border-top:1px solid #eee; padding-top:14px; font-size:10px; color:#A0AEC0; display:flex; justify-content:space-between; }
    .chip { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:700; }
    @media print { body { padding:24px 30px; } .noprint { display:none; } }
    .bar { position:fixed; bottom:0; left:0; right:0; background:#0A1628; color:#fff; padding:12px; text-align:center; }
    .bar button { background:#F5A623; border:none; padding:9px 22px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px; }
  </style></head><body>
  <div class="head">
    <img src="${origin}/krmu-logo.png" alt="KRMU" />
    <div>
      <h1>K.R. Mangalam University</h1>
      <div class="sub">Destination Success</div>
      <div class="addr">Sohna Road, Gurugram, Haryana 122103 · www.krmangalam.edu.in</div>
    </div>
    ${inner.includes("__DOCTYPE__") ? "" : ""}
  </div>
  ${inner}
  <div class="foot"><span>This is a computer-generated document. No physical signature required.</span><span>Generated ${today()}</span></div>
  <div class="bar noprint"><button onclick="window.print()">⬇ Save as PDF / Print</button></div>
  </body></html>`;
}

function open(html: string) {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  // Auto-trigger print once the logo image has loaded.
  w.onload = () => setTimeout(() => w.print(), 350);
  return true;
}

export function printFeeReceipt(f: FeeLike): boolean {
  const inner = `
    <div class="doctype" style="position:absolute;top:48px;right:54px;"><div class="t">Fee Receipt</div><div class="d">${f.receiptNo || "PROVISIONAL"}</div></div>
    <div class="meta">
      <div class="box"><div class="lbl">Student</div><div class="val">${f.studentName}</div></div>
      <div class="box"><div class="lbl">Programme</div><div class="val">${f.programme} · Sem ${f.semester}</div></div>
      <div class="box"><div class="lbl">Payment Date</div><div class="val">${f.paymentDate || today()}</div></div>
      <div class="box"><div class="lbl">Mode</div><div class="val">${f.paymentMode || "Online"}</div></div>
    </div>
    <table>
      <thead><tr><th>Fee Particulars</th><th class="r">Amount</th></tr></thead>
      <tbody>
        <tr><td>${f.feeHead}</td><td class="r">${inr(f.amount)}</td></tr>
        <tr><td>Amount Paid</td><td class="r" style="color:#0F9D58;font-weight:700">${inr(f.paid)}</td></tr>
        ${f.due > 0 ? `<tr><td>Balance Due</td><td class="r" style="color:#C8102E;font-weight:700">${inr(f.due)}</td></tr>` : ""}
      </tbody>
    </table>
    <div class="total"><div class="card">
      <div class="row"><span>Total Fee</span><span>${inr(f.amount)}</span></div>
      <div class="row"><span>Paid</span><span style="color:#0F9D58">${inr(f.paid)}</span></div>
      <div class="row grand"><span>Balance</span><span style="color:${f.due > 0 ? "#C8102E" : "#0F9D58"}">${inr(f.due)}</span></div>
    </div></div>
    ${f.due === 0 ? `<div class="stamp">PAID IN FULL</div>` : ""}
  `;
  return open(shell(`KRMU Fee Receipt ${f.receiptNo || ""}`, inner));
}

export function printFeeStatement(studentName: string, programme: string, semester: number, fees: FeeLike[]): boolean {
  const totAmt = fees.reduce((s, f) => s + f.amount, 0);
  const totPaid = fees.reduce((s, f) => s + f.paid, 0);
  const totDue = fees.reduce((s, f) => s + f.due, 0);
  const rows = fees.map(f => `<tr>
    <td>${f.feeHead}</td>
    <td class="r">${inr(f.amount)}</td>
    <td class="r" style="color:#0F9D58">${inr(f.paid)}</td>
    <td class="r" style="color:${f.due > 0 ? "#C8102E" : "#0F9D58"}">${f.due > 0 ? inr(f.due) : "—"}</td>
    <td><span class="chip" style="background:${f.status === "paid" ? "#dcfce7;color:#15803d" : f.status === "overdue" ? "#fee2e2;color:#b91c1c" : "#fef3c7;color:#b45309"}">${f.status}</span></td>
  </tr>`).join("");
  const inner = `
    <div class="doctype" style="position:absolute;top:48px;right:54px;"><div class="t">Fee Statement</div><div class="d">${today()}</div></div>
    <div class="meta">
      <div class="box"><div class="lbl">Student</div><div class="val">${studentName}</div></div>
      <div class="box"><div class="lbl">Programme</div><div class="val">${programme} · Sem ${semester}</div></div>
      <div class="box"><div class="lbl">Academic Year</div><div class="val">2024–25</div></div>
    </div>
    <table>
      <thead><tr><th>Fee Head</th><th class="r">Amount</th><th class="r">Paid</th><th class="r">Due</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total"><div class="card">
      <div class="row"><span>Total Billed</span><span>${inr(totAmt)}</span></div>
      <div class="row"><span>Total Paid</span><span style="color:#0F9D58">${inr(totPaid)}</span></div>
      <div class="row grand"><span>Outstanding</span><span style="color:${totDue > 0 ? "#C8102E" : "#0F9D58"}">${inr(totDue)}</span></div>
    </div></div>
  `;
  return open(shell(`KRMU Fee Statement — ${studentName}`, inner));
}
