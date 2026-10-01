import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output runs on any Node.js host (Vercel, Hostinger Node.js plans, a VPS).
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
