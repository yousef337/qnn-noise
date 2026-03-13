import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    resolveAlias: {
      fs: { browser: './empty.js' },
    },
  },
};

export default nextConfig;
