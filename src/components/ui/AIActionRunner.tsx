"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

// Executes client/session actions the AI orchestrator returned (navigate, sign out).
// The model DECIDES to call open_screen / sign_out; this just carries it out in the browser.
export function AIActionRunner() {
  const { aiActions, clearAIActions, logout } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!aiActions.length) return;
    for (const a of aiActions) {
      if (a.client === "navigate" && a.to) router.push(a.to);
      else if (a.client === "logout") { logout(); router.push("/login"); }
    }
    clearAIActions();
  }, [aiActions, clearAIActions, logout, router]);

  return null;
}
