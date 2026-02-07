/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only mode - no React pages
  reactStrictMode: true,

  // Enable standalone output for Docker
  output: 'standalone',

  // Disable static page generation
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

module.exports = nextConfig;
