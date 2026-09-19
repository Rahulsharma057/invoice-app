/** @type {import('next').NextConfig} */

// Backend URL comes from the environment instead of being hardcoded, so the
// same build can point at localhost in dev and a real API host in production
// just by changing BACKEND_URL (see .env.local.example).
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
