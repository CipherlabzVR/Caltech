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
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
}

module.exports = nextConfig
