import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow static image imports
  images: {
    unoptimized: true,
  },
  turbopack: {},
  // Webpack config for handling SVG and CSV as raw assets
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
