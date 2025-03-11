import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Turbopack configuration for external modules
        external: ['canvas']
      }
    }
  },
  webpack: (config, { dev }) => {
    // Only apply webpack-specific config in production
    if (!dev) {
      config.externals.push({
        'canvas': 'commonjs canvas'
      });
    }
    return config;
  }
};

export default nextConfig;
