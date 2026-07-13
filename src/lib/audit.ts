import { prisma } from "./db";

/** Append an entry to the audit log. Fire-and-forget — never blocks the main op. */
export async function audit(entry: { actor?: string; role?: string; action: string; module: string; detail: string; byAi?: boolean; prompt?: string }) {
  try {
    await prisma.auditLog.create({
      data: {
        actor: entry.actor || "system@krmu.edu.in",
        role: entry.role || "system",
        action: entry.action,
        module: entry.module,
        detail: entry.detail,
        at: new Date().toISOString(),
        byAi: entry.byAi ?? false,
        prompt: entry.prompt ?? null,
      },
    });
  } catch {
    /* audit must never break the request */
  }
}
