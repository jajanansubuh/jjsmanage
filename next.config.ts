import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  /* @ts-ignore - allowedDevOrigins is required for IP access in dev */
  allowedDevOrigins: ["192.168.100.11", "localhost:3000"],
  turbopack: {},
};

export default withPWA(nextConfig);
