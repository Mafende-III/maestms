/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PRIVATE_STANDALONE: 'true',
  },
  // Skip trailing slash redirects that can cause issues
  skipTrailingSlashRedirect: true,
  // Custom build ID to avoid conflicts
  generateBuildId: async () => {
    return process.env.BUILD_ID || 'development'
  },
  poweredByHeader: false,
}

module.exports = nextConfig