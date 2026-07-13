"use client";
import { useRouter } from "next/navigation";
import { ENROLMENT_TREND, SCHOOL_DISTRIBUTION, FEE_COLLECTION_MONTHLY, ATTENDANCE_WEEKLY, DASHBOARD_STATS } from "@/lib/data";

function LineChart({ data }: { data: { year: string; students: number }[] }) {
  const w = 520, h = 200, pad = 36;
  const max = Math.max(...data.map(d => d.students)) * 1.05;
  const min = Math.min(...data.map(d => d.students)) * 0.92;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.students)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${h - pad} L${x(0)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%" }}>
      <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1565C0" stopOpacity="0.22" /><stop offset="100%" stopColor="#1565C0" stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#ar)" />
      <path d={line} fill="none" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.students)} r="4" fill="white" stroke="#1565C0" strokeWidth="2.5" />
          <text x={x(i)} y={h - 12} textAnchor="middle" fontSize="10" fill="#A0AEC0">{d.year}</text>
          <text x={x(i)} y={y(d.students) - 12} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#0A1628">{d.students}</text>
        </g>
      ))}
    </svg>
  );
}

function Donut({ data }: { data: { school: string; students: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.students, 0);
  let acc = 0;
  const R = 70, C = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg viewBox="0 0 180 180" style={{ width: 160, height: 160, flexShrink: 0 }}>
        <g transform="rotate(-90 90 90)">
          {data.map((d, i) => {
            const frac = d.students / total;
            const dash = frac * C;
            const el = <circle key={i} cx="90" cy="90" r={R} fill="none" stroke={d.color} strokeWidth="22" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-acc} />;
            acc += dash;
            return el;
          })}
        </g>
        <text x="90" y="86" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0A1628" letterSpacing="-0.04em">{(total / 1000).toFixed(1)}K</text>
        <text x="90" y="104" textAnchor="middle" fontSize="10" fill="#A0AEC0">students</text>
      </svg>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
        {data.map(d => (
          <div key={d.school} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#525252", fontWeight: 600 }}>{d.school}</span>
            <span style={{ fontSize: 11, color: "#A0AEC0", marginLeft: "auto" }}>{d.students}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MISPage() {
  const router = useRouter();
  const feeMax = Math.max(...FEE_COLLECTION_MONTHLY.map(f => f.target));

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">MIS Dashboards</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Institution-wide analytics · Live data · Updated just now</div>
          </div>
          <button onClick={() => window.print()} className="btn btn-gold btn-sm cursor-hover">Export Board Report</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {/* KPI strip — click to drill into the module */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total Students", value: DASHBOARD_STATS.totalStudents.toLocaleString("en-IN"), sub: "+6.4% YoY", to: "/dashboard/students" },
            { label: "Faculty", value: DASHBOARD_STATS.totalFaculty, sub: "1:21 ratio", to: "/dashboard/hr" },
            { label: "Fee Collected", value: DASHBOARD_STATS.feeCollected, sub: "89% of target", to: "/dashboard/fees" },
            { label: "Attendance", value: DASHBOARD_STATS.attendanceToday, sub: "today avg", to: "/dashboard/attendance" },
            { label: "Hostel", value: DASHBOARD_STATS.hostelOccupancy, sub: "occupancy", to: "/dashboard/hostel" },
          ].map(k => (
            <button key={k.label} onClick={() => router.push(k.to)} className="card cursor-hover"
              style={{ padding: "16px 18px", textAlign: "left", border: "1px solid rgba(10,22,40,0.07)", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,22,40,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4C9D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.04em", margin: "6px 0 2px" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#0F9D58", fontWeight: 600 }}>{k.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, marginBottom: 18 }}>
          <div className="card card-p">
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>Enrolment Trend</div>
            <div style={{ fontSize: 11.5, color: "#A0AEC0", marginBottom: 12 }}>Total students over 5 academic years</div>
            <LineChart data={ENROLMENT_TREND} />
          </div>
          <div className="card card-p">
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>School Distribution</div>
            <div style={{ fontSize: 11.5, color: "#A0AEC0", marginBottom: 16 }}>Students by school</div>
            <Donut data={SCHOOL_DISTRIBUTION} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
          <div className="card card-p">
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>Fee Collection vs Target</div>
            <div style={{ fontSize: 11.5, color: "#A0AEC0", marginBottom: 18 }}>₹ Lakhs · monthly</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 160, paddingLeft: 4 }}>
              {FEE_COLLECTION_MONTHLY.map(f => (
                <div key={f.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: "100%", width: "100%", justifyContent: "center" }}>
                    <div title="Target" style={{ width: "32%", height: `${(f.target / feeMax) * 100}%`, background: "rgba(10,22,40,0.1)", borderRadius: "4px 4px 0 0" }} />
                    <div title="Collected" style={{ width: "32%", height: `${(f.collected / feeMax) * 100}%`, background: f.collected >= f.target ? "#0F9D58" : "#1565C0", borderRadius: "4px 4px 0 0" }} />
                  </div>
                  <span style={{ fontSize: 10.5, color: "#A0AEC0" }}>{f.month}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 11, color: "#737373" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#1565C0" }} /> Collected</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(10,22,40,0.1)" }} /> Target</span>
            </div>
          </div>
          <div className="card card-p">
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>Weekly Attendance</div>
            <div style={{ fontSize: 11.5, color: "#A0AEC0", marginBottom: 18 }}>Average % by day</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ATTENDANCE_WEEKLY.map(a => (
                <div key={a.day} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "#525252", width: 32, fontWeight: 600 }}>{a.day}</span>
                  <div style={{ flex: 1, height: 18, background: "#F1F3F6", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${a.percentage}%`, background: a.percentage >= 80 ? "#0F9D58" : a.percentage >= 73 ? "#F5A623" : "#C8102E", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>{a.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
