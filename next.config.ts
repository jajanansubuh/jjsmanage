import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "localhost",
    "127.0.0.1:3000",
    "127.0.0.1",
    "192.168.100.11:3000",
    "192.168.100.11",
    "plated-carded-crisply.ngrok-free.dev",
    "*.ngrok-free.dev"
  ],
  turbopack: {},
};

export default nextConfig;
