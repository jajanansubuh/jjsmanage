import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.11", "localhost:3000"],
  turbopack: {},
};

export default nextConfig;
