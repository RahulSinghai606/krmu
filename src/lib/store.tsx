"use client";
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, UserRole, AIMessage } from "./types";

export interface ClientAction { client: string; to?: string; label?: string }

interface AppState {
  user: User | null;
  authReady: boolean;
  aiActions: ClientAction[];
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  activeModule: string;
  aiMessages: AIMessage[];
  isAITyping: boolean;
}

interface AppActions {
  login: (role: UserRole) => Promise<void>;
  logout: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleAIPanel: () => void;
  setActiveModule: (module: string) => void;
  sendAIMessage: (message: string) => void;
  clearAIActions: () => void;
}

const DEMO_USERS: Record<UserRole, User> = {
  admin: { id: "u001", name: "Dr. Alok Tiwari", email: "alok.tiwari@krmu.edu.in", role: "admin", department: "Administration", school: "KRMU", employeeId: "KRMU-ADM-001" },
  registrar: { id: "u002", name: "Mrs. Shobha Nair", email: "shobha.nair@krmu.edu.in", role: "registrar", department: "Registry", school: "KRMU", employeeId: "KRMU-REG-001" },
  dean: { id: "u003", name: "Prof. S.K. Pandey", email: "sk.pandey@krmu.edu.in", role: "dean", department: "SOET", school: "SOET", employeeId: "KRMU-F-2012-003" },
  hod: { id: "u004", name: "Dr. Rajeev Sharma", email: "rajeev.sharma@krmu.edu.in", role: "hod", department: "Computer Science", school: "SOET", employeeId: "KRMU-F-2018-001" },
  faculty: { id: "u005", name: "Dr. Kavitha Reddy", email: "kavitha.reddy@krmu.edu.in", role: "faculty", department: "Computer Science", school: "SOET", employeeId: "KRMU-F-2019-008" },
  student: { id: "u006", name: "Priya Sharma", email: "priya.sharma@krmu.edu.in", role: "student", department: "Computer Science", school: "SOET", studentId: "KRMU2024CSE001" },
  finance: { id: "u007", name: "Mr. Deepak Jain", email: "deepak.jain@krmu.edu.in", role: "finance", department: "Finance", school: "KRMU", employeeId: "KRMU-FIN-003" },
  hostel_warden: { id: "u008", name: "Mrs. Anita Rawat", email: "anita.rawat@krmu.edu.in", role: "hostel_warden", department: "Hostel", school: "KRMU", employeeId: "KRMU-HST-001" },
  exam_officer: { id: "u009", name: "Mr. Vikas Chandra", email: "vikas.chandra@krmu.edu.in", role: "exam_officer", department: "Examination Cell", school: "KRMU", employeeId: "KRMU-EXAM-001" },
};

const AI_RESPONSES: Record<string, { response: string; sources?: string[] }> = {
  default: { response: "I can help you with information about students, attendance, fees, examinations, and more. What would you like to know?", sources: [] },
  attendance: { response: "Based on current data, overall attendance today is **78.4%**. There are **34 students** in B.Tech CSE 2024 batch trending below 75% attendance threshold. Shall I draft shortage notices for their mentors?", sources: ["Attendance Module — Jan 25, 2025"] },
  fee: { response: "Fee collection for January 2025 stands at **₹1.88 Cr** against a target of **₹2.20 Cr** (14.5% behind). There are **425 students** with pending dues above ₹15,000. I've already sent automated reminders to 312 students. Want me to escalate to parents via WhatsApp?", sources: ["Fee Management Module — Jan 25, 2025"] },
  students: { response: "Total enrolled students: **3,842** across 34 programmes. SOET has the highest enrolment at **1,680 students**. Currently **12 students** are on academic probation and **34** are at attendance risk. Shall I prepare the at-risk report?", sources: ["SIS Module — Jan 25, 2025"] },
  exam: { response: "End Semester Examinations commence **February 10, 2025**. Schedule has been released for all programmes. **3 hall bookings** are still pending confirmation. Internal marks entry is complete for 94% of courses — 6 faculty members have not submitted yet.", sources: ["Examination Module — Jan 25, 2025"] },
  results: { response: "Last semester results: Overall pass rate **92.1%**. B.Tech CSE had the highest pass rate at **92.6%**. MBA at **95.5%**. There are **8 result withheld** cases pending fee clearance. Shall I generate the detailed school-wise report?", sources: ["Examination Module — Sem V Results 2024"] },
  risk: { response: "**Academic Risk Analysis:**\n- **Rohit Verma** (ECE, Sem 4): 68% attendance + ₹85K dues — High Risk\n- **Arjun Kumar** (CSE, Sem 2): 72% attendance + ₹45K dues — Medium Risk\n- **Rahul Pandey** (MBA, Sem 4): 61% attendance + ₹1.2L dues — On Leave\n\nRecommendation: Immediate mentor counselling for 34 at-risk students.", sources: ["SIS", "Attendance", "Fee Management"] },
  naac: { response: "KRMU holds **NAAC Grade A** (CGPA 3.11) from 2023 review. Next review cycle: 2028. For the current cycle, IQAC has compiled data for Criteria 1-7. Student satisfaction survey completion is at 67%. Shall I generate the current data summary for all 7 criteria?", sources: ["Accreditation Module — NAAC Data 2024-25"] },
};

function getAIResponse(message: string): { response: string; sources?: string[] } {
  const lower = message.toLowerCase();
  if (lower.includes("attend")) return AI_RESPONSES.attendance;
  if (lower.includes("fee") || lower.includes("due") || lower.includes("payment")) return AI_RESPONSES.fee;
  if (lower.includes("student") || lower.includes("enroll")) return AI_RESPONSES.students;
  if (lower.includes("exam") || lower.includes("schedule")) return AI_RESPONSES.exam;
  if (lower.includes("result") || lower.includes("grade") || lower.includes("mark")) return AI_RESPONSES.results;
  if (lower.includes("risk") || lower.includes("at-risk") || lower.includes("dropout")) return AI_RESPONSES.risk;
  if (lower.includes("naac") || lower.includes("nirf") || lower.includes("accredit")) return AI_RESPONSES.naac;
  return AI_RESPONSES.default;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

// Fresh greeting per session — personalized to the role so history never bleeds across personas.
function greeting(user: User | null): AIMessage {
  const first = user?.name?.split(" ")[0];
  const who = user?.role === "student" ? `Hi ${first} — ask about your marks, attendance, fees, timetable, or raise a request.`
    : user?.role === "faculty" ? `Hi ${first} — ask about your classes, your students, or pending marks.`
    : `Hi ${first || "there"} — ask about students, fees, examinations, pending requests, or run a workflow.`;
  return { id: `init-${Date.now()}`, role: "assistant", content: who, timestamp: new Date(), sources: [] };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    authReady: false,
    aiActions: [],
    sidebarOpen: true,
    aiPanelOpen: false,
    activeModule: "dashboard",
    aiMessages: [greeting(null)],
    isAITyping: false,
  });

  // Restore session from the verified server cookie (not localStorage) on mount.
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setState(s => ({ ...s, user: d.user || null, authReady: true, aiMessages: [greeting(d.user || null)] })))
      .catch(() => setState(s => ({ ...s, authReady: true })));
  }, []);

  const login = useCallback(async (role: UserRole) => {
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    const data = await res.json();
    // Reset the assistant conversation on sign-in — one persona never sees another's history.
    if (res.ok && data.user) setState(s => ({ ...s, user: data.user, authReady: true, aiMessages: [greeting(data.user)], isAITyping: false, aiActions: [] }));
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setState(s => ({ ...s, user: null, activeModule: "dashboard", aiMessages: [greeting(null)], isAITyping: false, aiActions: [] }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState(s => ({ ...s, sidebarOpen: open }));
  }, []);

  const toggleAIPanel = useCallback(() => {
    setState(s => ({ ...s, aiPanelOpen: !s.aiPanelOpen }));
  }, []);

  const setActiveModule = useCallback((module: string) => {
    setState(s => ({ ...s, activeModule: module }));
  }, []);

  const sendAIMessage = useCallback((message: string) => {
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    let history: { role: string; content: string }[] = [];
    let role = "admin";
    let email = "";
    setState(s => {
      history = s.aiMessages.map(m => ({ role: m.role, content: m.content }));
      role = s.user?.role || "admin";
      email = s.user?.email || "";
      return { ...s, aiMessages: [...s.aiMessages, userMsg], isAITyping: true };
    });

    const pushAssistant = (content: string, sources?: string[]) => {
      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content,
        timestamp: new Date(),
        sources,
      };
      setState(s => ({ ...s, aiMessages: [...s.aiMessages, assistantMsg], isAITyping: false }));
    };

    // AI-native path: governed orchestrator (tool-calling + approval).
    // Falls back to the grounded chat route, then to local keyword responses.
    (async () => {
      try {
        const res = await fetch("/api/ai/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history, role, email }),
        });
        const data = await res.json();
        if (res.ok && data.response) {
          const srcs: string[] = [...(data.sources || [])];
          if (data.toolsUsed?.length) srcs.push(`🔧 ${data.toolsUsed.join(", ")}`);
          if (data.pending?.length) srcs.push(`⏳ ${data.pending.length} action(s) awaiting approval`);
          pushAssistant(data.response, srcs.length ? srcs : undefined);
          if (data.clientActions?.length) setState(s => ({ ...s, aiActions: data.clientActions }));
          return;
        }
      } catch { /* fall through */ }

      // Fallback 1: grounded chat route
      try {
        const res = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history, role, email }),
        });
        const data = await res.json();
        if (res.ok && data.response) { pushAssistant(data.response, data.grounded ? ["Live ERP data"] : undefined); return; }
      } catch { /* fall through */ }

      // Fallback 2: local keyword
      const fb = getAIResponse(message);
      pushAssistant(fb.response, fb.sources);
    })();
  }, []);

  const clearAIActions = useCallback(() => setState(s => (s.aiActions.length ? { ...s, aiActions: [] } : s)), []);

  return (
    <AppContext.Provider value={{ ...state, login, logout, setSidebarOpen, toggleAIPanel, setActiveModule, sendAIMessage, clearAIActions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
