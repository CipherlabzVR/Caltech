/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true
  },
  optimizeFonts: false,
  // Hundreds of files import named icons from the @mui/icons-material barrel.
  // That barrel re-exports every icon, so webpack parses thousands of modules
  // per page and the production compile exceeds Vercel's 8 GB build container.
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  experimental: {
    // Run each webpack compile in a worker so the client graph can be freed
    // before the server compile starts.
    webpackBuildWorker: true,
    // Static generation otherwise fans out across CPUs. This app has ~1300
    // pages and two locales; one worker keeps that phase under the RAM cap.
    cpus: 1,
  },
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
  },
  webpack: (config, { dev }) => {
    // Avoid Windows dev-server errors: ENOENT renaming .next/cache/webpack pack files
    // (filesystem pack cache races on some drives/antivirus setups).
    if (dev && process.platform === 'win32') {
      config.cache = { type: 'memory' };
    }
    if (!dev) {
      // Webpack's default parallelism is 100, which keeps a much larger
      // module graph resident. The Vercel builder has 2 cores.
      config.parallelism = 2;
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
}

module.exports = nextConfig
