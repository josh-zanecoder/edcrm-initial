import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    //Temporary ignore typescript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    //Temporary ignore eslint errors
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {},
};

export default nextConfig;
