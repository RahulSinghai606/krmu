// Deterministic, explainable lead-conversion scoring for the admission funnel.
// (Azure only writes follow-up language; the propensity score is transparent math.)

const SOURCE_WEIGHT: Record<string, number> = { referral: 0.92, fair: 0.72, website: 0.6, social: 0.48 };
const PROG_DEMAND: Record<string, number> = {
  "B.Tech CSE": 0.92, "B.Tech AI & ML": 0.9, "B.Tech ECE": 0.7, "MBA": 0.78, "BBA": 0.66, "B.Tech ME": 0.6,
};
const STAGE_BUMP: Record<string, number> = { application: 0.15, enquiry: 0, admitted: 0, lost: -1 };

export interface LeadLike {
  source: string; programme: string; stage: string; contactedCount: number;
  lastContactAt?: string | null; createdAt: string;
}

function daysBetween(iso: string, now: number): number {
  const t = new Date(iso + (iso.length <= 10 ? "T00:00:00Z" : "")).getTime();
  return isNaN(t) ? 0 : Math.max(0, Math.round((now - t) / 86400000));
}

// 0–100 conversion propensity + human-readable reasons.
export function scoreLead(l: LeadLike, now = Date.now()): { score: number; reasons: string[] } {
  const src = SOURCE_WEIGHT[l.source] ?? 0.5;
  const prog = PROG_DEMAND[l.programme] ?? 0.6;
  const engagement = Math.min(1, l.contactedCount / 3);            // more touchpoints → warmer
  const ageDays = daysBetween(l.createdAt, now);
  const recency = Math.max(0, 1 - ageDays / 30);                    // fresh enquiries convert better
  let s = src * 0.34 + prog * 0.24 + engagement * 0.2 + recency * 0.22 + (STAGE_BUMP[l.stage] ?? 0);
  s = Math.max(0, Math.min(1, s));
  const score = Math.round(s * 100);

  const reasons: string[] = [];
  if (src >= 0.7) reasons.push(`high-quality source (${l.source})`);
  if (prog >= 0.85) reasons.push(`in-demand programme (${l.programme})`);
  if (l.stage === "application") reasons.push("already applied");
  if (engagement >= 0.66) reasons.push("engaged (multiple touchpoints)");
  else if (l.contactedCount === 0) reasons.push("never contacted yet");
  if (recency >= 0.6) reasons.push("recent enquiry");
  else if (ageDays > 20) reasons.push(`going cold (${ageDays}d old)`);
  return { score, reasons };
}

// Priority for "who to call today": open leads, hot + overdue for contact first.
export function callPriority(l: LeadLike & { score: number }, now = Date.now()): number {
  if (l.stage === "admitted" || l.stage === "lost") return -1;
  const sinceContact = l.lastContactAt ? daysBetween(l.lastContactAt, now) : 99;
  return l.score + Math.min(30, sinceContact * 2); // hotter + longer-since-contact → higher
}

export function daysSince(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  return daysBetween(iso, now);
}
