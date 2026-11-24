import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export estático para desplegar en Firebase Hosting sin servidor Node.js.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
