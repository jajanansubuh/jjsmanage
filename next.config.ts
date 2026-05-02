import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* @ts-ignore - allowedDevOrigins is required for IP access in dev */
  allowedDevOrigins: ["192.168.100.11", "localhost:3000"],
};

export default nextConfig;
