import crypto from "crypto";
import type { NextRequest } from "next/server";
import type { User, UserRole } from "./types";
import { DEMO_USERS } from "./users";

// Signed, HTTP-only session cookie — the SERVER's source of truth for identity.
// Request bodies are never trusted for role/email (closes the C1/C2 spoof holes).
const SECRET = process.env.SESSION_SECRET || "krmu-dev-session-secret-change-in-prod";
export const SESSION_COOKIE = "krmu_session";

export interface Session { email: string; role: UserRole; name: string; studentId?: string }

function sign(payloadB64: string): string {
  return crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export function createSessionToken(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): Session | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (sign(payload) !== sig) return null; // tamper / forgery
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!s.email || !s.role) return null;
    return s;
  } catch { return null; }
}

// Read the verified session from the request cookie. Returns null if absent/invalid.
export function getSession(req: NextRequest): Session | null {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export function sessionForRole(role: UserRole): { user: User; token: string } | null {
  const user = DEMO_USERS[role];
  if (!user) return null;
  const token = createSessionToken({ email: user.email, role: user.role, name: user.name, studentId: user.studentId });
  return { user, token };
}
