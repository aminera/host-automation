import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer", "cloudinary"],
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
