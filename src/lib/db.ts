import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// On Vercel the filesystem is read-only except /tmp, so we copy the bundled
// seeded SQLite DB into /tmp (writable, warm-instance-persistent) on cold start.
function resolveUrl(): string {
  if (process.env.VERCEL) {
    const dst = "/tmp/krmu.db";
    try {
      if (!fs.existsSync(dst)) {
        fs.copyFileSync(path.join(process.cwd(), "prisma", "seed.sqlite"), dst);
      }
    } catch (e) {
      console.error("[db] failed to seed /tmp db:", e);
    }
    return "file:" + dst;
  }
  return process.env.DATABASE_URL || "file:./prisma/dev.db";
}

// Singleton — avoids exhausting connections during Next.js dev hot-reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error", "warn"], datasources: { db: { url: resolveUrl() } } });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
