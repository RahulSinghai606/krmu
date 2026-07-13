"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { canAccess, moduleFromPath } from "@/lib/access";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AIPanel } from "@/components/layout/AIPanel";
import { AIActionRunner } from "@/components/ui/AIActionRunner";
import { VoiceOrb } from "@/components/ui/VoiceOrb";

function Shell({ children }: { children: React.ReactNode }) {
  const { user, authReady, sidebarOpen, aiPanelOpen } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authReady && !user) { router.push("/login"); return; }
    // Role guard: redirect away from modules this role may not open.
    if (authReady && user && !canAccess(user.role, moduleFromPath(pathname))) {
      router.replace("/dashboard");
    }
  }, [authReady, user, pathname, router]);

  if (!authReady || !user) return null;
  if (!canAccess(user.role, moduleFromPath(pathname))) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <div
        className="app-content"
        style={{
          marginLeft: sidebarOpen ? 260 : 0,
          marginRight: aiPanelOpen ? 380 : 0,
          transition: "margin 0.4s cubic-bezier(0.16,1,0.3,1)",
          minHeight: "100vh",
          background: "#F7F7F5",
        }}
      >
        <Topbar />
        <main style={{ flex: 1, padding: "0" }}>
          {children}
        </main>
      </div>
      <AIPanel />
      <AIActionRunner />
      <VoiceOrb />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
