import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // In dev, skip the Image Optimization server route (Sharp). Remote hero images can
    // otherwise make the first load look “stuck” while /_next/image compiles or warms up.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
