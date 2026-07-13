import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,

  // Production compression
  compress: true,

  // Security headers (also set in middleware, this is a second layer)
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-store, max-age=0",
        },
      ],
    },
  ],

  // Cache static assets aggressively
  staticPageGenerationTimeout: 120,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  // Exclude bot from the Next.js build (bot runs as separate process)
  outputFileTracingExcludes: {
    "*": ["./src/bot/**/*"],
  },
};

export default nextConfig;
