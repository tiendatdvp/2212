import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.0.96"],
  output: "standalone",
};

export default nextConfig;
