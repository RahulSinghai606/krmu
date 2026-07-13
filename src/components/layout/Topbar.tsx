"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Menu, Search, Bell, Sparkles } from "lucide-react";

export function Topbar() {
  const { user, sidebarOpen, setSidebarOpen, toggleAIPanel, aiPanelOpen } = useApp();
  const [search, setSearch] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  return (
    <div className="topbar" style={{
      background: "white",
      borderBottom: "1px solid rgba(10,22,40,0.07)",
      height: 56, padding: "0 24px",
      display: "flex", alignItems: "center", gap: 12,
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="cursor-hover"
        style={{ background: "none", border: "none", padding: 6, borderRadius: 8, color: "#525252", display: "flex", alignItems: "center", transition: "background 0.15s" }}
      >
        <Menu size={18} strokeWidth={1.8} />
      </button>

      {/* Search */}
      <div style={{
        flex: 1, maxWidth: 400, position: "relative",
        transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <Search size={14} strokeWidth={2} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#A0AEC0" }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          placeholder="Search students, courses, faculty…"
          className="cursor-hover"
          style={{
            width: "100%", paddingLeft: 34, paddingRight: 14,
            height: 34, borderRadius: 8, border: "none",
            background: searchFocus ? "white" : "#F7F7F5",
            fontSize: 13, color: "#0A1628",
            outline: searchFocus ? "2px solid rgba(21,101,192,0.25)" : "none",
            transition: "all 0.2s",
            letterSpacing: "-0.01em",
          }}
        />
        {searchFocus && (
          <div style={{
            fontSize: 10, color: "#A0AEC0", position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "#F0F0EE", padding: "2px 6px", borderRadius: 4, fontWeight: 500,
          }}>⌘K</div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Notifications */}
        <button
          className="cursor-hover"
          style={{
            background: "none", border: "none", padding: 8, borderRadius: 8,
            color: "#525252", position: "relative", display: "flex", alignItems: "center",
          }}
        >
          <Bell size={17} strokeWidth={1.8} />
          <span style={{
            position: "absolute", top: 4, right: 4,
            width: 8, height: 8, borderRadius: "50%",
            background: "#C8102E", border: "1.5px solid white",
          }} />
        </button>

        {/* AI Toggle */}
        <button
          onClick={toggleAIPanel}
          className="cursor-hover"
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 12px", borderRadius: 8,
            background: aiPanelOpen ? "#1565C0" : "rgba(21,101,192,0.1)",
            border: "none",
            color: aiPanelOpen ? "white" : "#1565C0",
            fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em",
            transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <Sparkles size={14} strokeWidth={1.8} />
          AI
        </button>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #1f6fd6, #1250a6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "white",
          marginLeft: 4, flexShrink: 0,
          cursor: "none",
        }}>
          {user?.name.split(" ").map(n => n[0]).join("").slice(0,2) ?? "KR"}
        </div>
      </div>
    </div>
  );
}
