import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { computeELA } from "@/lib/forensics/ela";
import { azureVisionJSON, azureReady } from "@/lib/ai/azure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF = ["admin", "registrar", "dean", "exam_officer"];

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const docs = await prisma.admissionDocument.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ documents: docs });
}

interface VisionOut {
  fields?: Record<string, string>;
  legible?: boolean;
  visualAnomalies?: string[];
  authenticityConcerns?: string[];
}

export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("image") as File | null;
  const formName = String(form.get("applicantName") || "").trim();
  const type = String(form.get("type") || "marksheet");
  if (!file) return NextResponse.json({ error: "image required" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());

  // 1) Real ELA forensics
  let ela: { score: number; heatmap: string };
  try { ela = await computeELA(buf); }
  catch (e) { return NextResponse.json({ error: "ELA failed: " + String(e) }, { status: 500 }); }

  // 2) Vision OCR + authenticity assessment (Azure GPT vision)
  const dataUrl = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
  let vision: VisionOut = {};
  if (azureReady()) {
    try {
      vision = await azureVisionJSON<VisionOut>(dataUrl,
        `You are a university admissions document-forensics examiner. The image is a submitted ${type} for admission.
Extract the printed fields and assess authenticity. Return JSON:
{"fields":{"name":"","rollNo":"","board":"","year":"","marks":"","percentage":""},
 "legible":true|false,
 "visualAnomalies":[ "misaligned text","inconsistent fonts","erased/overwritten regions","mismatched seal/logo","irregular spacing" ...only those actually visible ],
 "authenticityConcerns":[ concrete reasons this document may be tampered or forged; empty if it looks genuine ]}`);
    } catch { vision = { authenticityConcerns: [], visualAnomalies: [], legible: true }; }
  }

  const concerns = vision.authenticityConcerns || [];
  const anomalies = vision.visualAnomalies || [];
  let verdict: "clean" | "review" | "forgery";
  if (ela.score >= 68 || concerns.length >= 2) verdict = "forgery";
  else if (ela.score >= 46 || concerns.length >= 1 || anomalies.length >= 2) verdict = "review";
  else verdict = "clean";

  // Auto-catch the applicant name from OCR when the form field is left blank.
  const ocrName = (vision.fields?.name || "").toString().trim();
  const applicantName = formName || ocrName || "Unknown Applicant";
  const findings = { elaScore: ela.score, extracted: vision.fields || {}, visualAnomalies: anomalies, authenticityConcerns: concerns, legible: vision.legible ?? true, nameSource: formName ? "entered" : ocrName ? "auto-extracted" : "unknown" };

  const doc = await prisma.admissionDocument.create({
    data: {
      applicantName, type, imageName: file.name || null, elaScore: ela.score,
      verdict, findings: JSON.stringify(findings), createdAt: new Date().toISOString(),
    },
  });
  await audit({ actor: s.email, role: s.role, action: "Admission document verified", module: "Admissions", detail: `${applicantName} · ${type} · ELA ${ela.score} · ${verdict}`, byAi: true });

  return NextResponse.json({ document: doc, findings, heatmap: ela.heatmap, verdict, elaScore: ela.score });
}
