import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm', 'remark-parse', 'unified', 'bail', 'is-plain-obj', 'trough', 'vfile', 'vfile-message', 'unist-util-stringify-position', 'mdast-util-from-markdown', 'mdast-util-to-string', 'micromark', 'decode-named-character-reference', 'character-entities', 'mdast-util-gfm', 'mdast-util-gfm-autolink-literal', 'mdast-util-gfm-footnote', 'mdast-util-gfm-strikethrough', 'mdast-util-gfm-table', 'mdast-util-gfm-task-list-item', 'mdast-util-find-and-replace', 'micromark-extension-gfm', 'micromark-util-combine-extensions', 'micromark-extension-gfm-autolink-literal', 'micromark-extension-gfm-footnote', 'micromark-extension-gfm-strikethrough', 'micromark-extension-gfm-table', 'micromark-extension-gfm-tagfilter', 'micromark-extension-gfm-task-list-item', 'micromark-util-chunked', 'micromark-util-classify-character', 'micromark-util-html-tag-name', 'micromark-util-normalize-identifier', 'micromark-util-resolve-all', 'micromark-util-sanitize-uri', 'trim-lines', 'unist-util-is', 'unist-util-visit', 'unist-util-visit-parents', 'unist-util-position', 'unist-util-generated', 'devlop', 'hast-util-to-jsx-runtime', 'hast-util-whitespace', 'property-information', 'space-separated-tokens', 'comma-separated-tokens', 'estree-util-is-identifier-name', 'hast-util-is-element', 'html-url-attributes'],
  // Ottimizzazioni per le performance e memoria
  compress: true, // Abilita compressione gzip
  
  // Ottimizzazione delle immagini
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 anno
    deviceSizes: [640, 750, 828, 1080], // Ridotto numero di sizes
    imageSizes: [16, 32, 48, 64, 96], // Ridotto
  },
  
  // Configurazione della build
  poweredByHeader: false,
  
  // Ottimizzazione runtime
  reactStrictMode: false, // Disabilitato per ridurre doppio render in dev
  
  // Experimental features per performance e memoria
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts', 'react-icons', 'framer-motion'],
  },
  
  // Configurazione webpack per ottimizzare memoria
  webpack: (config, { isServer }) => {
    // Ottimizza chunking per ridurre memoria
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module: any) {
              const match = module.context?.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              const packageName = match ? match[1] : 'vendors';
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
        },
      };
    }
    return config;
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
