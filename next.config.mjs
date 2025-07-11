/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Remove any experimental features that might cause issues
      },
      // Ensure proper routing
      trailingSlash: false,
      // Add any other configuration you need
    };

export default nextConfig;
