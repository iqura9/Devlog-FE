import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // react-markdown and remark-* are pure ESM; Next.js needs to transpile them.
  transpilePackages: ["react-markdown", "remark-gfm", "remark-parse", "unified", "vfile", "unist-util-visit"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
