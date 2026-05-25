import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sql.js"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // sql.js uses WASM - handle it properly on server side
      config.externals = [...(config.externals || []), "sql.js"];
    }
    return config;
  },
};

export default nextConfig;
