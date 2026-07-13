import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public document-authenticity check (used by the /verify page — e.g. a visa officer).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const row = await prisma.certificateRequest.findFirst({ where: { hash: hash.toUpperCase(), status: "issued" } });
  if (!row) return NextResponse.json({ valid: false });
  return NextResponse.json({
    valid: true,
    type: row.type, studentName: row.studentName, purpose: row.purpose,
    issueDate: row.issueDate, signedBy: row.signedBy, code: row.hash,
    issuer: "K.R. Mangalam University · Office of the Registrar",
  });
}
