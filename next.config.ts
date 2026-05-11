import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts'],
  },
};

export default nextConfig;
