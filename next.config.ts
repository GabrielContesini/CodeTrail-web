import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/download/windows",
        destination: "/auth",
        permanent: true,
      },
      {
        source: "/api/download/windows",
        destination: "/auth",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
