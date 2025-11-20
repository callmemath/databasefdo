import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ottimizzazioni per le performance
  compress: true, // Abilita compressione gzip
  
  // Ottimizzazione delle immagini
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 anno
  },
  
  // Configurazione della build
  poweredByHeader: false,
  
  // Ottimizzazione runtime
  reactStrictMode: true,
  
  // Experimental features per performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts', 'react-icons'],
  },
  
  // Headers per caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
