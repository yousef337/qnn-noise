import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';
const repoName = 'qnn-noise';

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export',
  basePath: isProduction ? `/${repoName}` : '',
  assetPrefix: isProduction ? `/${repoName}/` : '',
  turbopack: {
    resolveAlias: {
      fs: { browser: './empty.js' },
    },
  },
};

export default nextConfig;
