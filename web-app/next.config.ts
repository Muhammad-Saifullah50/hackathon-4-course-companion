import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactStrictMode: true,
};

export default nextConfig;
