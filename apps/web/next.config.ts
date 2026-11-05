import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The repo is an npm workspace. Pin tracing to it so Next does not walk a lockfile in the home directory.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
