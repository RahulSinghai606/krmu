import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: { ignoreBuildErrors: true },
  // Bundle the seeded SQLite DB + Prisma engine into the serverless functions.
  outputFileTracingIncludes: {
    "/**": ["./prisma/seed.sqlite", "./node_modules/.prisma/client/**"],
  },
};

export default nextConfig;
