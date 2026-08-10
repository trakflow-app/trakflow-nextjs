import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Matches MAX_OCR_FILE_BYTES in app/services/project-inventory-ocr-services.ts;
      // Next.js defaults Server Actions to 1MB, which rejects larger OCR uploads
      // before that service's own size check ever runs.
      bodySizeLimit: '15mb',
    },
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol.replace(':', '') as 'http' | 'https',
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: '/storage/v1/object/sign/**',
          },
        ]
      : [],
  },
};

export default nextConfig;
