import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, // Sembunyikan header "X-Powered-By: Next.js" (keamanan)
  serverExternalPackages: ['pg'], // Optimasi bundling untuk driver PostgreSQL
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Batas ukuran request body untuk server actions
    },
  },
};

export default nextConfig;
