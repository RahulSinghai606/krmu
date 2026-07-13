// §6.3.3 Retrieval over institutional knowledge.
// KRMU policies/ordinances indexed for retrieval; answers about rules are grounded here + cited.
// Offline lexical retrieval (no external embedding service → satisfies India data-residency by default).

export interface KBDoc { id: string; title: string; category: string; text: string }

export const KNOWLEDGE_BASE: KBDoc[] = [
  { id: "att-01", title: "Attendance & Shortage Policy", category: "Academic Ordinance",
    text: "A student must maintain a minimum of 75% attendance in every course to be eligible to appear in the end-semester examination. Students between 65% and 75% may apply for condonation on medical or institutional grounds, supported by documents, subject to approval by the Dean. Below 65% there is no condonation and the student is debarred from the examination in that course and must repeat it." },
  { id: "fee-01", title: "Fee Payment & Refund Policy", category: "Finance Regulation",
    text: "Semester fees are due by the date notified each cycle, currently 31 January for the even semester. A late fee applies after the due date. Students with outstanding dues after the deadline are debarred from examinations until cleared. Refunds on withdrawal follow the UGC schedule: 100% before classes commence, tapering to nil after a defined cut-off. Scholarship and concession adjustments are applied before computing dues." },
  { id: "grade-01", title: "Grading & CGPA Scheme", category: "Examination Ordinance",
    text: "KRMU uses a 10-point CGPA scale. Grades: O (90-100, 10 points), A+ (80-89, 9), A (70-79, 8), B+ (60-69, 7), B (50-59, 6), C (45-49, 5), F (below 45, 0). A grade of F is a fail and the course must be repeated. CGPA is the credit-weighted average of grade points across all registered courses. A student needs an overall pass and no active F to be awarded the degree." },
  { id: "reg-01", title: "Semester Registration Rules", category: "Academic Ordinance",
    text: "Every student must register for courses each semester within the notified window. The permitted credit load is 18 to 26 credits per semester. Registration requires fee clearance and satisfaction of pre-requisites. Add/drop is allowed only within the first two weeks. Registration is confirmed after advisor approval and registrar confirmation; an unregistered student is not permitted to attend classes or appear in examinations." },
  { id: "griev-01", title: "Grievance Redressal Procedure", category: "Student Welfare",
    text: "Any student may lodge a grievance through the portal. Grievances are routed by category to the responsible office and must be acknowledged within 48 hours and resolved within a target of 7 working days. Unresolved or escalated cases go to the Grievance Redressal Committee. Disciplinary matters follow a separate committee process with the right to be heard." },
  { id: "hostel-01", title: "Hostel Allocation & Conduct", category: "Campus Services",
    text: "Hostel rooms are allocated on application, subject to availability, with priority by distance and merit. Residents must abide by the code of conduct, in-time rules and mess regulations. Room changes require warden approval. Ragging is strictly prohibited and attracts immediate disciplinary action under UGC anti-ragging regulations." },
  { id: "schol-01", title: "Scholarships & Concessions", category: "Finance Regulation",
    text: "KRMU offers merit scholarships (for high CGPA), the KREE merit-cum-means scholarship, SC/ST and EWS concessions, sibling discounts and sports scholarships. Eligibility is verified each year and the benefit is applied against tuition before dues are computed. A student may hold only one merit scholarship at a time; concessions may combine per policy." },
  { id: "exam-01", title: "Examination Conduct & Re-evaluation", category: "Examination Ordinance",
    text: "End-semester examinations are held per the published schedule. A hall ticket, issued only to eligible students with cleared dues and adequate attendance, is required. Students may apply for re-evaluation or re-totalling within the notified window on payment of the prescribed fee. Use of unfair means is a disciplinary offence handled by the Examination Committee." },
];

import { prisma } from "@/lib/db";

const STOP = new Set("the a an of to in for and or is are be on at by with as from this that your you my our we i it".split(" "));

// Score a query against a supplied doc set (lexical TF-IDF-ish). Shared by static + DB retrieval.
function scoreDocs(query: string, docs: KBDoc[], k: number) {
  const q = tokenize(query);
  if (!q.length || !docs.length) return [];
  const df: Record<string, number> = {};
  docs.forEach(d => { const seen = new Set(tokenize(d.title + " " + d.text)); seen.forEach(t => { df[t] = (df[t] || 0) + 1; }); });
  const N = docs.length;
  return docs.map(d => {
    const toks = tokenize(d.title + " " + d.title + " " + d.text);
    let score = 0;
    for (const term of q) { const tf = toks.filter(t => t === term).length; if (tf) score += tf * Math.log(1 + N / (df[term] || 1)); }
    const sentences = d.text.split(/(?<=\.)\s+/);
    const snippet = sentences.find(s => q.some(term => s.toLowerCase().includes(term))) || sentences[0];
    return { doc: d, score, snippet };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}

// §6.3.3 — retrieve over the LIVE policy index (DB). New/edited policies are searchable immediately.
export async function retrieveLive(query: string, k = 3) {
  try {
    const rows = await prisma.policy.findMany();
    const docs: KBDoc[] = rows.length ? rows.map(r => ({ id: r.id, title: r.title, category: r.category, text: r.text })) : KNOWLEDGE_BASE;
    return scoreDocs(query, docs, k);
  } catch {
    return scoreDocs(query, KNOWLEDGE_BASE, k);
  }
}
const tokenize = (s: string) => s.toLowerCase().replace(/[^a-z0-9% ]/g, " ").split(/\s+/).filter(w => w && !STOP.has(w));

// Lexical relevance: term overlap weighted by rarity (lightweight TF-IDF-ish), returns top matches with a snippet.
export function retrieve(query: string, k = 3): { doc: KBDoc; score: number; snippet: string }[] {
  const q = tokenize(query);
  if (!q.length) return [];
  const df: Record<string, number> = {};
  KNOWLEDGE_BASE.forEach(d => { const seen = new Set(tokenize(d.title + " " + d.text)); seen.forEach(t => { df[t] = (df[t] || 0) + 1; }); });
  const N = KNOWLEDGE_BASE.length;
  const scored = KNOWLEDGE_BASE.map(d => {
    const toks = tokenize(d.title + " " + d.title + " " + d.text); // title weighted x2
    let score = 0;
    for (const term of q) {
      const tf = toks.filter(t => t === term).length;
      if (tf) score += tf * Math.log(1 + N / (df[term] || 1));
    }
    // snippet: first sentence containing any query term
    const sentences = d.text.split(/(?<=\.)\s+/);
    const snip = sentences.find(s => q.some(term => s.toLowerCase().includes(term))) || sentences[0];
    return { doc: d, score, snippet: snip };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
