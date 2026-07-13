"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { canAccess, labelFor, type ModuleKey } from "@/lib/access";
import {
  LayoutGrid, BarChart3, Sparkles, Bell, Users, BookOpen, PenSquare, CalendarDays,
  CheckSquare, FileText, IndianRupee, Briefcase, Building2, Bus, MessageSquare,
  Award, ShieldCheck, FolderClosed, KeyRound, Workflow, TrendingUp, ClipboardCheck, Activity, LogOut,
} from "lucide-react";

const NAV: { group: string; items: { key: ModuleKey; label: string; icon: string; path: string; badge?: string | number }[] }[] = [
  {
    group: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "grid", path: "/dashboard" },
      { key: "mis", label: "MIS Analytics", icon: "bar-chart", path: "/dashboard/mis" },
      { key: "ai", label: "AI Assistant", icon: "sparkles", path: "/dashboard/ai", badge: "AI" },
      { key: "workflows", label: "AI Workflows", icon: "workflow", path: "/dashboard/workflows" },
      { key: "predictions", label: "Predictions", icon: "trending", path: "/dashboard/predictions" },
      { key: "approvals", label: "AI Approvals", icon: "clipboard-check", path: "/dashboard/approvals" },
      { key: "aiops", label: "Governance", icon: "activity", path: "/dashboard/aiops" },
      { key: "notifications", label: "Notifications", icon: "bell", path: "/dashboard/notifications" },
    ],
  },
  {
    group: "Academic",
    items: [
      { key: "students", label: "Students (SIS)", icon: "users", path: "/dashboard/students" },
      { key: "curriculum", label: "Curriculum", icon: "book-open", path: "/dashboard/curriculum" },
      { key: "registration", label: "Registration", icon: "edit", path: "/dashboard/registration" },
      { key: "timetable", label: "Timetable", icon: "calendar", path: "/dashboard/timetable" },
      { key: "timetable-generator", label: "AI Timetable Prep", icon: "sparkles", path: "/dashboard/timetable-generator" },
      { key: "calendar", label: "Calendar", icon: "calendar", path: "/dashboard/calendar" },
      { key: "attendance", label: "Attendance", icon: "check-square", path: "/dashboard/attendance" },
      { key: "examinations", label: "Examinations", icon: "file-text", path: "/dashboard/examinations" },
    ],
  },
  {
    group: "Finance & HR",
    items: [
      { key: "fees", label: "Fee Management", icon: "dollar-sign", path: "/dashboard/fees" },
      { key: "hr", label: "HR & Faculty", icon: "briefcase", path: "/dashboard/hr" },
    ],
  },
  {
    group: "Campus",
    items: [
      { key: "hostel", label: "Hostel", icon: "home", path: "/dashboard/hostel" },
      { key: "transport", label: "Transport", icon: "truck", path: "/dashboard/transport" },
      { key: "grievance", label: "Grievance", icon: "message-circle", path: "/dashboard/grievance" },
    ],
  },
  {
    group: "Administration",
    items: [
      { key: "certificates", label: "Certificates", icon: "award", path: "/dashboard/certificates" },
      { key: "accreditation", label: "Accreditation", icon: "shield", path: "/dashboard/accreditation" },
      { key: "documents", label: "Documents", icon: "folder", path: "/dashboard/documents" },
      { key: "access", label: "Access Control", icon: "lock", path: "/dashboard/access" },
      { key: "designsystem", label: "Design System", icon: "grid", path: "/dashboard/designsystem" },
    ],
  },
];

const ICONS: Record<string, JSX.Element> = {
  "grid": <LayoutGrid size={16} strokeWidth={1.8} />,
  "bar-chart": <BarChart3 size={16} strokeWidth={1.8} />,
  "sparkles": <Sparkles size={16} strokeWidth={1.8} />,
  "bell": <Bell size={16} strokeWidth={1.8} />,
  "users": <Users size={16} strokeWidth={1.8} />,
  "book-open": <BookOpen size={16} strokeWidth={1.8} />,
  "edit": <PenSquare size={16} strokeWidth={1.8} />,
  "calendar": <CalendarDays size={16} strokeWidth={1.8} />,
  "check-square": <CheckSquare size={16} strokeWidth={1.8} />,
  "file-text": <FileText size={16} strokeWidth={1.8} />,
  "dollar-sign": <IndianRupee size={16} strokeWidth={1.8} />,
  "briefcase": <Briefcase size={16} strokeWidth={1.8} />,
  "home": <Building2 size={16} strokeWidth={1.8} />,
  "truck": <Bus size={16} strokeWidth={1.8} />,
  "message-circle": <MessageSquare size={16} strokeWidth={1.8} />,
  "award": <Award size={16} strokeWidth={1.8} />,
  "shield": <ShieldCheck size={16} strokeWidth={1.8} />,
  "folder": <FolderClosed size={16} strokeWidth={1.8} />,
  "lock": <KeyRound size={16} strokeWidth={1.8} />,
  "workflow": <Workflow size={16} strokeWidth={1.8} />,
  "trending": <TrendingUp size={16} strokeWidth={1.8} />,
  "clipboard-check": <ClipboardCheck size={16} strokeWidth={1.8} />,
  "activity": <Activity size={16} strokeWidth={1.8} />,
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, user, logout } = useApp();

  if (!sidebarOpen) return null;

  return (
    <div className="sidebar sidebar-scroll" style={{ overflowY: "auto" }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(10,22,40,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/krmu-logo.png" alt="KRMU" width={38} height={38}
            style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }} />
          <div>
            <div style={{ color: "#0A1628", fontWeight: 800, fontSize: 13, letterSpacing: "-0.02em", lineHeight: 1.2 }}>K.R. Mangalam</div>
            <div style={{ color: "#A0AEC0", fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>University ERP</div>
          </div>
        </div>

        {/* User pill */}
        {user && (
          <div style={{
            marginTop: 14, padding: "8px 10px",
            background: "#F4F7FD",
            borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #F5A623, #c9871a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0,
            }}>
              {user.name.split(" ").map(n => n[0]).join("").slice(0,2)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#0A1628", fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ color: "#737373", fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>{user.role.replace(/_/g, " ")}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation — filtered by the signed-in role */}
      <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
        {NAV.map(group => {
          const items = group.items.filter(i => canAccess(user?.role, i.key));
          if (items.length === 0) return null;
          return (
          <div key={group.group}>
            <div className="sidebar-group-label">{group.group}</div>
            {items.map(item => {
              const active = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-item cursor-hover ${active ? "active" : ""}`}
                >
                  <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{ICONS[item.icon]}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{labelFor(user?.role, item.key, item.label)}</span>
                  {item.badge && (
                    <span style={{
                      padding: "1px 7px",
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 700,
                      background: typeof item.badge === "number" ? "#C8102E" : "rgba(245,166,35,0.2)",
                      color: typeof item.badge === "number" ? "white" : "#F5A623",
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 10px 16px", borderTop: "1px solid rgba(10,22,40,0.08)" }}>
        <button
          onClick={logout}
          className="sidebar-item cursor-hover"
          style={{ width: "100%", cursor: "none", background: "none", border: "none", color: "#737373" }}
        >
          <LogOut size={15} strokeWidth={1.8} />
          <span style={{ fontSize: 13 }}>Sign out</span>
        </button>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <span style={{ fontSize: 9.5, color: "#C4C9D4", letterSpacing: "0.06em" }}>KRMU ERP v1.0 · 2025</span>
        </div>
      </div>
    </div>
  );
}
