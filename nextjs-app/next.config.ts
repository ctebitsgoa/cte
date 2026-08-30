import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Course covers, team photos and course files live in Supabase Storage.
    // Serving them through next/image means the image optimizer fetches each
    // original from Supabase once and then serves cached, resized copies —
    // which is what keeps Supabase's cached egress down as traffic grows.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Uploads get a unique path (or a ?v= buster on overwrite), so the
    // optimized copies are safe to hold on to.
    minimumCacheTTL: 31536000,
    // Courses without a cover fall back to /placeholder.svg, and the uploads
    // bucket accepts image/svg+xml, so the optimizer has to pass SVG through.
    // Locked down so an uploaded SVG can't execute anything.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
