import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output runs on any Node.js host (Vercel, Hostinger Node.js plans, a VPS).
  output: "standalone",
  poweredByHeader: false,
  // Local photo storage (dev) reads files by path, which makes the tracer include the whole
  // project; keep non-runtime folders out of the standalone bundle.
  outputFileTracingExcludes: {
    "*": ["storage/**", "tests/**", "docs/**", "db/**", "scripts/**", ".claude/**", "test-results/**"],
  },
  experimental: {
    // Photos are resized in the browser first; 4 MB stays under Vercel's 4.5 MB request limit.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
