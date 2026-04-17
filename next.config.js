/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Google avatar (used in OAuth profile pics)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Supabase storage (review photos, profile pics)
      { protocol: 'https', hostname: '*.supabase.co' },
      // Unsplash (landing-page imagery)
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
}

module.exports = nextConfig
