import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Fix workspace root detection when parent dirs have lockfiles
  outputFileTracingRoot: resolve(__dirname),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.playtomic.io",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "playtomic.s3.eu-west-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
