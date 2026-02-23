/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensures proper behavior for NextAuth with App Router on Vercel
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
