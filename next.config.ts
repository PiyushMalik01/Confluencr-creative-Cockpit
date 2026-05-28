import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '8mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  serverExternalPackages: ['sharp', 'cheerio', 'playwright-core', '@react-pdf/renderer'],
};

export default nextConfig;
