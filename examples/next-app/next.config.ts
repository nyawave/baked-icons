import { withBakedIcons } from '@nyawave/baked-icons/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withBakedIcons(nextConfig);
