import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage(covers 버킷)의 표지 이미지를 next/image 로 최적화(WebP/AVIF + 리사이즈)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
