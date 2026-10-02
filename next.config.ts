import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Supabase Storage (the "product-images" bucket) is allowed as a remote image
   * source for next/image. The hostname is read from the environment rather
   * than hard-coded so the same config works locally and on Netlify.
   */
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

  experimental: {
    /**
     * Disable Turbopack's filesystem cache for production builds.
     *
     * The cache (`.next/cache/turbopack`) embeds resolved build-time values,
     * which Netlify's secret scanner then flags as leaked credentials. Turning
     * it off keeps generated build output free of inlined secrets.
     */
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
