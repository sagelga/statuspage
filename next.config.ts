import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// Gives `next dev` access to the bindings declared in wrangler.jsonc.
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  // The only image is a local, correctly sized logo; skip the runtime optimizer
  // so the Worker does not need a separate image-optimization binding.
  images: { unoptimized: true },
};

export default nextConfig;
